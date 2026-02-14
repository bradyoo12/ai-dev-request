using System.Runtime.CompilerServices;
using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IStreamingCodeGenService
{
    Task<StreamingCodeGenSession> CreateSessionAsync(string userId, string? prompt, int? devRequestId);
    Task<StreamingCodeGenSession?> GetSessionAsync(Guid sessionId);
    Task<List<StreamingCodeGenSession>> GetUserSessionsAsync(string userId);
    Task<StreamingCodeGenSession> CancelSessionAsync(Guid sessionId);
    IAsyncEnumerable<CodeGenStreamEvent> StreamCodeGenerationAsync(Guid sessionId, CancellationToken cancellationToken);
}

public class StreamingCodeGenService : IStreamingCodeGenService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<StreamingCodeGenService> _logger;

    public StreamingCodeGenService(AiDevRequestDbContext context, ILogger<StreamingCodeGenService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<StreamingCodeGenSession> CreateSessionAsync(string userId, string? prompt, int? devRequestId)
    {
        // Cancel any existing active sessions for the user
        var activeSessions = await _context.StreamingCodeGenSessions
            .Where(s => s.UserId == userId && (s.Status == "streaming" || s.Status == "idle" || s.Status == "building"))
            .ToListAsync();

        foreach (var active in activeSessions)
        {
            active.Status = "cancelled";
            active.UpdatedAt = DateTime.UtcNow;
        }

        var session = new StreamingCodeGenSession
        {
            UserId = userId,
            Prompt = prompt,
            DevRequestId = devRequestId,
            Status = "idle",
        };

        _context.StreamingCodeGenSessions.Add(session);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created streaming code gen session {SessionId} for user {UserId}", session.Id, userId);
        return session;
    }

    public async Task<StreamingCodeGenSession?> GetSessionAsync(Guid sessionId)
    {
        return await _context.StreamingCodeGenSessions.FindAsync(sessionId);
    }

    public async Task<List<StreamingCodeGenSession>> GetUserSessionsAsync(string userId)
    {
        return await _context.StreamingCodeGenSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(20)
            .ToListAsync();
    }

    public async Task<StreamingCodeGenSession> CancelSessionAsync(Guid sessionId)
    {
        var session = await _context.StreamingCodeGenSessions.FindAsync(sessionId)
            ?? throw new InvalidOperationException("Session not found.");

        if (session.Status != "streaming" && session.Status != "idle" && session.Status != "building")
            throw new InvalidOperationException("Session is not active.");

        session.Status = "cancelled";
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cancelled streaming code gen session {SessionId}", sessionId);
        return session;
    }

    public async IAsyncEnumerable<CodeGenStreamEvent> StreamCodeGenerationAsync(
        Guid sessionId,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var session = await _context.StreamingCodeGenSessions.FindAsync(sessionId);
        if (session == null)
        {
            yield return new CodeGenStreamEvent { Type = "error", Data = "Session not found." };
            yield break;
        }

        // Mark as streaming
        session.Status = "streaming";
        session.StartedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Get simulated project files (in production, this calls Claude streaming API)
        var files = GetProjectFiles(session.Prompt);
        session.TotalFiles = files.Count;
        session.TotalTokens = files.Sum(f => f.Content.Length / 4);
        await _context.SaveChangesAsync(cancellationToken);

        // Send stream_start event
        yield return new CodeGenStreamEvent
        {
            Type = "stream_start",
            Data = JsonSerializer.Serialize(new
            {
                sessionId = session.Id,
                totalFiles = session.TotalFiles,
                totalTokens = session.TotalTokens,
                prompt = session.Prompt,
            })
        };

        var totalStreamedTokens = 0;
        var completedFiles = 0;
        var fileProgresses = new List<FileGenProgress>();

        foreach (var file in files)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                session.Status = "cancelled";
                session.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(CancellationToken.None);
                yield return new CodeGenStreamEvent { Type = "error", Data = "Stream cancelled by client." };
                yield break;
            }

            // Check for external cancellation
            await _context.Entry(session).ReloadAsync(cancellationToken);
            if (session.Status == "cancelled")
            {
                yield return new CodeGenStreamEvent { Type = "error", Data = "Stream cancelled." };
                yield break;
            }

            session.CurrentFile = file.Path;
            session.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            // Emit file_created event
            yield return new CodeGenStreamEvent
            {
                Type = "file_created",
                Data = JsonSerializer.Serialize(new
                {
                    file = file.Path,
                    language = file.Language,
                    fileIndex = files.IndexOf(file),
                    totalFiles = files.Count,
                })
            };

            // Stream the file content chunk by chunk (typing effect)
            var fileTokens = 0;
            var chunkSize = 25;
            for (var i = 0; i < file.Content.Length; i += chunkSize)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var chunk = file.Content.Substring(i, Math.Min(chunkSize, file.Content.Length - i));
                var chunkTokens = Math.Max(1, chunk.Length / 4);
                fileTokens += chunkTokens;
                totalStreamedTokens += chunkTokens;

                yield return new CodeGenStreamEvent
                {
                    Type = "code_chunk",
                    Data = JsonSerializer.Serialize(new
                    {
                        file = file.Path,
                        chunk,
                        tokens = chunkTokens,
                    })
                };

                session.StreamedTokens = totalStreamedTokens;
                session.ProgressPercent = session.TotalTokens > 0
                    ? Math.Round((double)totalStreamedTokens / session.TotalTokens * 100, 1)
                    : 0;

                // Typing effect delay (25-65ms)
                await Task.Delay(Random.Shared.Next(25, 65), cancellationToken);

                // Progress update every 5 chunks
                if ((i / chunkSize) % 5 == 0)
                {
                    yield return new CodeGenStreamEvent
                    {
                        Type = "progress_update",
                        Data = JsonSerializer.Serialize(new
                        {
                            streamedTokens = totalStreamedTokens,
                            totalTokens = session.TotalTokens,
                            progressPercent = session.ProgressPercent,
                            currentFile = file.Path,
                            completedFiles,
                            totalFiles = files.Count,
                        })
                    };
                }
            }

            completedFiles++;
            session.CompletedFiles = completedFiles;
            fileProgresses.Add(new FileGenProgress
            {
                Path = file.Path,
                Language = file.Language,
                Status = "completed",
                TokenCount = fileTokens,
            });

            session.GeneratedFilesJson = JsonSerializer.Serialize(fileProgresses);
            session.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            yield return new CodeGenStreamEvent
            {
                Type = "file_updated",
                Data = JsonSerializer.Serialize(new
                {
                    file = file.Path,
                    language = file.Language,
                    tokenCount = fileTokens,
                    completedFiles,
                    totalFiles = files.Count,
                })
            };
        }

        // Build phase
        session.Status = "building";
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(CancellationToken.None);

        yield return new CodeGenStreamEvent
        {
            Type = "build_progress",
            Data = JsonSerializer.Serialize(new
            {
                step = "install",
                status = "running",
                output = "Installing dependencies...",
            })
        };

        await Task.Delay(800, cancellationToken);

        yield return new CodeGenStreamEvent
        {
            Type = "build_progress",
            Data = JsonSerializer.Serialize(new
            {
                step = "install",
                status = "completed",
                output = "Dependencies installed successfully.",
            })
        };

        yield return new CodeGenStreamEvent
        {
            Type = "build_progress",
            Data = JsonSerializer.Serialize(new
            {
                step = "build",
                status = "running",
                output = "Building project...",
            })
        };

        await Task.Delay(600, cancellationToken);

        yield return new CodeGenStreamEvent
        {
            Type = "build_progress",
            Data = JsonSerializer.Serialize(new
            {
                step = "build",
                status = "completed",
                output = "Build completed successfully.",
            })
        };

        session.BuildProgressJson = JsonSerializer.Serialize(new
        {
            steps = new[]
            {
                new { step = "install", status = "completed" },
                new { step = "build", status = "completed" },
            }
        });

        // Preview ready
        session.Status = "preview_ready";
        session.PreviewUrl = $"/preview/session/{session.Id}";
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(CancellationToken.None);

        yield return new CodeGenStreamEvent
        {
            Type = "preview_ready",
            Data = JsonSerializer.Serialize(new
            {
                previewUrl = session.PreviewUrl,
                sessionId = session.Id,
            })
        };

        // Complete
        session.Status = "completed";
        session.CompletedAt = DateTime.UtcNow;
        session.ProgressPercent = 100;
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(CancellationToken.None);

        yield return new CodeGenStreamEvent
        {
            Type = "stream_complete",
            Data = JsonSerializer.Serialize(new
            {
                sessionId = session.Id,
                totalTokens = totalStreamedTokens,
                totalFiles = completedFiles,
                durationMs = (session.CompletedAt!.Value - session.StartedAt!.Value).TotalMilliseconds,
                previewUrl = session.PreviewUrl,
            })
        };
    }

    private static List<ProjectFile> GetProjectFiles(string? prompt)
    {
        // In production, Claude streaming API generates these files based on the prompt
        var projectName = string.IsNullOrWhiteSpace(prompt) ? "My App" : prompt;
        return new List<ProjectFile>
        {
            new()
            {
                Path = "package.json",
                Language = "json",
                Content = $$"""
                {
                  "name": "generated-app",
                  "version": "1.0.0",
                  "private": true,
                  "type": "module",
                  "scripts": {
                    "dev": "vite",
                    "build": "tsc && vite build",
                    "preview": "vite preview"
                  },
                  "dependencies": {
                    "react": "^19.0.0",
                    "react-dom": "^19.0.0",
                    "react-router-dom": "^7.0.0"
                  },
                  "devDependencies": {
                    "@types/react": "^19.0.0",
                    "@types/react-dom": "^19.0.0",
                    "typescript": "^5.9.0",
                    "vite": "^7.0.0",
                    "@vitejs/plugin-react": "^5.0.0",
                    "tailwindcss": "^4.0.0"
                  }
                }
                """
            },
            new()
            {
                Path = "src/main.tsx",
                Language = "tsx",
                Content = """
                import React from 'react';
                import ReactDOM from 'react-dom/client';
                import App from './App';
                import './index.css';

                ReactDOM.createRoot(document.getElementById('root')!).render(
                  <React.StrictMode>
                    <App />
                  </React.StrictMode>
                );
                """
            },
            new()
            {
                Path = "src/App.tsx",
                Language = "tsx",
                Content = $$"""
                import { BrowserRouter, Routes, Route } from 'react-router-dom';
                import Layout from './components/Layout';
                import HomePage from './pages/HomePage';
                import AboutPage from './pages/AboutPage';
                import ContactPage from './pages/ContactPage';

                export default function App() {
                  return (
                    <BrowserRouter>
                      <Routes>
                        <Route element={<Layout />}>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                        </Route>
                      </Routes>
                    </BrowserRouter>
                  );
                }
                """
            },
            new()
            {
                Path = "src/index.css",
                Language = "css",
                Content = """
                @import 'tailwindcss';

                :root {
                  --primary: #3b82f6;
                  --primary-dark: #2563eb;
                }

                body {
                  font-family: 'Inter', system-ui, sans-serif;
                  -webkit-font-smoothing: antialiased;
                }
                """
            },
            new()
            {
                Path = "src/components/Layout.tsx",
                Language = "tsx",
                Content = $$$"""
                import { Outlet, Link, useLocation } from 'react-router-dom';

                export default function Layout() {
                  const location = useLocation();
                  const navItems = [
                    { path: '/', label: 'Home' },
                    { path: '/about', label: 'About' },
                    { path: '/contact', label: 'Contact' },
                  ];

                  return (
                    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
                      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {{{projectName}}}
                          </span>
                          <div className="flex gap-1">
                            {navItems.map(item => (
                              <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  location.pathname === item.path
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </nav>
                      <main className="max-w-6xl mx-auto px-6 py-10">
                        <Outlet />
                      </main>
                      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
                        Built with AI Dev Request Platform
                      </footer>
                    </div>
                  );
                }
                """
            },
            new()
            {
                Path = "src/pages/HomePage.tsx",
                Language = "tsx",
                Content = """
                import { useState } from 'react';

                export default function HomePage() {
                  const [count, setCount] = useState(0);

                  return (
                    <div className="space-y-8">
                      <section className="text-center py-16">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                          Welcome to Your App
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                          A modern React application built with TypeScript, Tailwind CSS,
                          and React Router. Generated in real-time by AI.
                        </p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                            <span className="text-2xl">⚡</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                          <p className="text-sm text-gray-600">Built with Vite for instant HMR and optimized builds.</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                            <span className="text-2xl">🎨</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Beautiful UI</h3>
                          <p className="text-sm text-gray-600">Styled with Tailwind CSS for a polished look.</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                            <span className="text-2xl">🔒</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">Type Safe</h3>
                          <p className="text-sm text-gray-600">Full TypeScript support for reliable code.</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-4xl font-bold text-gray-900 mb-4">{count}</p>
                        <button
                          onClick={() => setCount(c => c + 1)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                          Click to Increment
                        </button>
                      </div>
                    </div>
                  );
                }
                """
            },
            new()
            {
                Path = "src/pages/AboutPage.tsx",
                Language = "tsx",
                Content = """
                export default function AboutPage() {
                  return (
                    <div className="max-w-3xl mx-auto space-y-8">
                      <h1 className="text-4xl font-bold text-gray-900">About</h1>
                      <p className="text-lg text-gray-600 leading-relaxed">
                        This application was generated in real-time using the AI Dev Request
                        platform. Watch as code streams in line-by-line, files are created,
                        and your app takes shape before your eyes.
                      </p>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tech Stack</h2>
                        <ul className="space-y-3">
                          {['React 19', 'TypeScript 5.9', 'Vite 7', 'Tailwind CSS 4', 'React Router 7'].map(tech => (
                            <li key={tech} className="flex items-center gap-3 text-gray-700">
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                              {tech}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                }
                """
            },
            new()
            {
                Path = "src/pages/ContactPage.tsx",
                Language = "tsx",
                Content = """
                import { useState } from 'react';

                export default function ContactPage() {
                  const [submitted, setSubmitted] = useState(false);

                  return (
                    <div className="max-w-2xl mx-auto space-y-8">
                      <h1 className="text-4xl font-bold text-gray-900">Contact</h1>
                      {submitted ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                          <p className="text-green-700 font-medium text-lg">Message sent successfully!</p>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6"
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input type="text" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                            <textarea rows={4} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                          </div>
                          <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                            Send Message
                          </button>
                        </form>
                      )}
                    </div>
                  );
                }
                """
            },
        };
    }
}

// === Supporting Types ===

public class CodeGenStreamEvent
{
    public string Type { get; set; } = "";
    public string Data { get; set; } = "";
}

public class ProjectFile
{
    public string Path { get; set; } = "";
    public string Language { get; set; } = "";
    public string Content { get; set; } = "";
}

public class FileGenProgress
{
    public string Path { get; set; } = "";
    public string Language { get; set; } = "";
    public string Status { get; set; } = "pending";
    public int TokenCount { get; set; }
}
