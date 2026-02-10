using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IStreamingGenerationService
{
    Task<GenerationStream> StartStreamAsync(int devRequestId);
    Task<GenerationStream?> GetStreamStatusAsync(int devRequestId);
    Task<GenerationStream> CancelStreamAsync(int devRequestId);
    Task<List<GenerationStream>> GetStreamHistoryAsync(int devRequestId);
    IAsyncEnumerable<StreamEvent> StreamGenerationAsync(int devRequestId, CancellationToken cancellationToken);
}

public class StreamingGenerationService : IStreamingGenerationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<StreamingGenerationService> _logger;

    public StreamingGenerationService(AiDevRequestDbContext context, ILogger<StreamingGenerationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<GenerationStream> StartStreamAsync(int devRequestId)
    {
        // Cancel any active streams for this request
        var activeStreams = await _context.GenerationStreams
            .Where(s => s.DevRequestId == devRequestId && (s.Status == "streaming" || s.Status == "idle"))
            .ToListAsync();

        foreach (var active in activeStreams)
        {
            active.Status = "cancelled";
        }

        var stream = new GenerationStream
        {
            DevRequestId = devRequestId,
            Status = "idle",
        };

        _context.GenerationStreams.Add(stream);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created generation stream {StreamId} for request {DevRequestId}",
            stream.Id, devRequestId);

        return stream;
    }

    public async Task<GenerationStream?> GetStreamStatusAsync(int devRequestId)
    {
        return await _context.GenerationStreams
            .Where(s => s.DevRequestId == devRequestId)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<GenerationStream> CancelStreamAsync(int devRequestId)
    {
        var stream = await _context.GenerationStreams
            .Where(s => s.DevRequestId == devRequestId && (s.Status == "streaming" || s.Status == "idle"))
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException("No active stream found for this request.");

        stream.Status = "cancelled";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cancelled generation stream {StreamId} for request {DevRequestId}",
            stream.Id, devRequestId);

        return stream;
    }

    public async Task<List<GenerationStream>> GetStreamHistoryAsync(int devRequestId)
    {
        return await _context.GenerationStreams
            .Where(s => s.DevRequestId == devRequestId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async IAsyncEnumerable<StreamEvent> StreamGenerationAsync(
        int devRequestId,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var stream = await _context.GenerationStreams
            .Where(s => s.DevRequestId == devRequestId && s.Status == "idle")
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (stream == null)
        {
            yield return new StreamEvent { Type = "error", Data = "No idle stream found. Start a new generation first." };
            yield break;
        }

        // Mark as streaming
        stream.Status = "streaming";
        stream.StartedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        // Simulated files to generate (in production, this would come from AI engine analysis)
        var files = GetSimulatedFiles(devRequestId);
        stream.TotalFiles = files.Count;
        stream.TotalTokens = files.Sum(f => f.Content.Length / 4); // Approximate token count
        stream.GeneratedFiles = JsonSerializer.Serialize(
            files.Select(f => new { path = f.Path, status = "pending", tokenCount = 0 }));
        await _context.SaveChangesAsync(cancellationToken);

        yield return new StreamEvent
        {
            Type = "stream_start",
            Data = JsonSerializer.Serialize(new
            {
                streamId = stream.Id,
                totalFiles = stream.TotalFiles,
                totalTokens = stream.TotalTokens,
            })
        };

        var totalStreamedTokens = 0;
        var completedFiles = 0;
        var fileProgresses = new List<GeneratedFileProgress>();

        foreach (var file in files)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                stream.Status = "cancelled";
                await _context.SaveChangesAsync(CancellationToken.None);
                yield return new StreamEvent { Type = "error", Data = "Stream cancelled by client." };
                yield break;
            }

            // Reload to check for cancellation from another request
            await _context.Entry(stream).ReloadAsync(cancellationToken);
            if (stream.Status == "cancelled")
            {
                yield return new StreamEvent { Type = "error", Data = "Stream cancelled." };
                yield break;
            }

            stream.CurrentFile = file.Path;
            await _context.SaveChangesAsync(cancellationToken);

            yield return new StreamEvent
            {
                Type = "file_start",
                Data = JsonSerializer.Serialize(new
                {
                    file = file.Path,
                    fileIndex = files.IndexOf(file),
                    totalFiles = files.Count,
                })
            };

            // Stream the file content chunk by chunk
            var fileTokens = 0;
            var chunkSize = 20; // Characters per chunk (simulating token-by-token)
            for (var i = 0; i < file.Content.Length; i += chunkSize)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var chunk = file.Content.Substring(i, Math.Min(chunkSize, file.Content.Length - i));
                var chunkTokens = Math.Max(1, chunk.Length / 4);
                fileTokens += chunkTokens;
                totalStreamedTokens += chunkTokens;

                yield return new StreamEvent
                {
                    Type = "code_chunk",
                    Data = JsonSerializer.Serialize(new
                    {
                        file = file.Path,
                        chunk,
                        tokens = chunkTokens,
                    })
                };

                // Update progress
                stream.StreamedTokens = totalStreamedTokens;
                stream.ProgressPercent = stream.TotalTokens > 0
                    ? Math.Round((double)totalStreamedTokens / stream.TotalTokens * 100, 1)
                    : 0;

                // Simulate streaming delay (30-80ms per chunk)
                await Task.Delay(Random.Shared.Next(30, 80), cancellationToken);

                // Periodic progress update (every 5 chunks)
                if ((i / chunkSize) % 5 == 0)
                {
                    yield return new StreamEvent
                    {
                        Type = "progress_update",
                        Data = JsonSerializer.Serialize(new
                        {
                            streamedTokens = totalStreamedTokens,
                            totalTokens = stream.TotalTokens,
                            progressPercent = stream.ProgressPercent,
                            currentFile = file.Path,
                        })
                    };
                }
            }

            completedFiles++;
            stream.CompletedFiles = completedFiles;
            fileProgresses.Add(new GeneratedFileProgress
            {
                Path = file.Path,
                Status = "completed",
                TokenCount = fileTokens,
            });

            stream.GeneratedFiles = JsonSerializer.Serialize(
                fileProgresses.Select(fp => new { path = fp.Path, status = fp.Status, tokenCount = fp.TokenCount }));
            await _context.SaveChangesAsync(cancellationToken);

            yield return new StreamEvent
            {
                Type = "file_complete",
                Data = JsonSerializer.Serialize(new
                {
                    file = file.Path,
                    tokenCount = fileTokens,
                    completedFiles,
                    totalFiles = files.Count,
                })
            };
        }

        // Mark as completed
        stream.Status = "completed";
        stream.CompletedAt = DateTime.UtcNow;
        stream.ProgressPercent = 100;
        await _context.SaveChangesAsync(CancellationToken.None);

        yield return new StreamEvent
        {
            Type = "stream_complete",
            Data = JsonSerializer.Serialize(new
            {
                streamId = stream.Id,
                totalTokens = totalStreamedTokens,
                totalFiles = completedFiles,
                durationMs = (stream.CompletedAt!.Value - stream.StartedAt!.Value).TotalMilliseconds,
            })
        };
    }

    private static List<SimulatedFile> GetSimulatedFiles(int devRequestId)
    {
        // In production, this would be replaced with actual AI-generated code via Claude API
        return new List<SimulatedFile>
        {
            new()
            {
                Path = "src/App.tsx",
                Content = """
                import React from 'react';
                import { BrowserRouter, Routes, Route } from 'react-router-dom';
                import HomePage from './pages/HomePage';
                import AboutPage from './pages/AboutPage';
                import Layout from './components/Layout';

                function App() {
                  return (
                    <BrowserRouter>
                      <Routes>
                        <Route element={<Layout />}>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/about" element={<AboutPage />} />
                        </Route>
                      </Routes>
                    </BrowserRouter>
                  );
                }

                export default App;
                """
            },
            new()
            {
                Path = "src/components/Layout.tsx",
                Content = """
                import React from 'react';
                import { Outlet, Link } from 'react-router-dom';

                export default function Layout() {
                  return (
                    <div className="min-h-screen bg-gray-50">
                      <nav className="bg-white shadow-sm border-b">
                        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-6">
                          <Link to="/" className="font-bold text-blue-600">Home</Link>
                          <Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link>
                        </div>
                      </nav>
                      <main className="max-w-7xl mx-auto px-4 py-8">
                        <Outlet />
                      </main>
                    </div>
                  );
                }
                """
            },
            new()
            {
                Path = "src/pages/HomePage.tsx",
                Content = """
                import React, { useState } from 'react';

                export default function HomePage() {
                  const [count, setCount] = useState(0);

                  return (
                    <div className="space-y-6">
                      <h1 className="text-3xl font-bold text-gray-900">
                        Welcome to Your App
                      </h1>
                      <p className="text-gray-600">
                        This is a generated application with React and TypeScript.
                      </p>
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-lg mb-4">Counter: {count}</p>
                        <button
                          onClick={() => setCount(c => c + 1)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Increment
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
                Content = """
                import React from 'react';

                export default function AboutPage() {
                  return (
                    <div className="space-y-4">
                      <h1 className="text-3xl font-bold text-gray-900">About</h1>
                      <p className="text-gray-600">
                        This application was generated by AI Dev Request platform.
                      </p>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-2">Features</h2>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          <li>React 18 with TypeScript</li>
                          <li>Tailwind CSS for styling</li>
                          <li>React Router for navigation</li>
                          <li>Responsive design</li>
                        </ul>
                      </div>
                    </div>
                  );
                }
                """
            }
        };
    }
}

// === Supporting Types ===

public class StreamEvent
{
    public string Type { get; set; } = "";
    public string Data { get; set; } = "";
}

public class SimulatedFile
{
    public string Path { get; set; } = "";
    public string Content { get; set; } = "";
}

public class GeneratedFileProgress
{
    public string Path { get; set; } = "";
    public string Status { get; set; } = "pending";
    public int TokenCount { get; set; }
}
