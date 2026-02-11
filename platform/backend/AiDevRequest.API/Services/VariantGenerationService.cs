using System.Text.Json;
using AiDevRequest.API.Data;
using AiDevRequest.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace AiDevRequest.API.Services;

public interface IVariantGenerationService
{
    Task<List<GenerationVariant>> GenerateVariantsAsync(Guid devRequestId, string userId, string description);
    Task<List<GenerationVariant>> GetVariantsAsync(Guid devRequestId, string userId);
    Task<GenerationVariant?> GetVariantAsync(Guid devRequestId, Guid variantId, string userId);
    Task<GenerationVariant?> SelectVariantAsync(Guid devRequestId, Guid variantId, string userId);
    Task<GenerationVariant?> RateVariantAsync(Guid devRequestId, Guid variantId, string userId, int rating);
    Task<bool> DeleteVariantsAsync(Guid devRequestId, string userId);
}

public class VariantGenerationService : IVariantGenerationService
{
    private readonly AiDevRequestDbContext _context;
    private readonly ILogger<VariantGenerationService> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public VariantGenerationService(
        AiDevRequestDbContext context,
        ILogger<VariantGenerationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<GenerationVariant>> GenerateVariantsAsync(Guid devRequestId, string userId, string description)
    {
        // Delete any existing variants for this request
        var existing = await _context.GenerationVariants
            .Where(v => v.DevRequestId == devRequestId && v.UserId == userId)
            .ToListAsync();
        if (existing.Count > 0)
        {
            _context.GenerationVariants.RemoveRange(existing);
            await _context.SaveChangesAsync();
        }

        var approaches = new[]
        {
            new { Name = "minimal", Label = "Minimal & Lightweight",
                  Desc = "Focused on simplicity with minimal dependencies. Clean code, small bundle size, fast loading." },
            new { Name = "balanced", Label = "Balanced & Production-Ready",
                  Desc = "Well-rounded approach with standard patterns, error handling, and maintainability." },
            new { Name = "feature-rich", Label = "Feature-Rich & Comprehensive",
                  Desc = "Full-featured implementation with advanced patterns, robust error handling, and extensibility." }
        };

        var variants = new List<GenerationVariant>();

        for (int i = 0; i < approaches.Length; i++)
        {
            var approach = approaches[i];
            var variant = new GenerationVariant
            {
                DevRequestId = devRequestId,
                UserId = userId,
                VariantNumber = i + 1,
                Approach = approach.Name,
                Description = approach.Desc,
                Status = "ready"
            };

            var files = GenerateVariantCode(description, approach.Name);
            variant.FilesJson = JsonSerializer.Serialize(files, JsonOptions);
            variant.FileCount = files.Count;
            variant.LinesOfCode = files.Sum(f => f.Content.Split('\n').Length);
            variant.DependencyCount = CountDependencies(files, approach.Name);
            variant.EstimatedBundleSizeKb = EstimateBundleSize(approach.Name, variant.LinesOfCode);
            variant.ModelTier = approach.Name == "minimal" ? "Haiku" : approach.Name == "balanced" ? "Sonnet" : "Opus";
            variant.TokensUsed = variant.LinesOfCode * 4;

            variants.Add(variant);
        }

        _context.GenerationVariants.AddRange(variants);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Generated {Count} variants for request {RequestId}", variants.Count, devRequestId);

        return variants;
    }

    public async Task<List<GenerationVariant>> GetVariantsAsync(Guid devRequestId, string userId)
    {
        return await _context.GenerationVariants
            .Where(v => v.DevRequestId == devRequestId && v.UserId == userId)
            .OrderBy(v => v.VariantNumber)
            .ToListAsync();
    }

    public async Task<GenerationVariant?> GetVariantAsync(Guid devRequestId, Guid variantId, string userId)
    {
        return await _context.GenerationVariants
            .FirstOrDefaultAsync(v => v.Id == variantId && v.DevRequestId == devRequestId && v.UserId == userId);
    }

    public async Task<GenerationVariant?> SelectVariantAsync(Guid devRequestId, Guid variantId, string userId)
    {
        var variants = await _context.GenerationVariants
            .Where(v => v.DevRequestId == devRequestId && v.UserId == userId)
            .ToListAsync();

        var selected = variants.FirstOrDefault(v => v.Id == variantId);
        if (selected == null) return null;

        foreach (var v in variants)
        {
            v.IsSelected = v.Id == variantId;
            v.Status = v.Id == variantId ? "selected" : "rejected";
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Selected variant {VariantId} for request {RequestId}", variantId, devRequestId);

        return selected;
    }

    public async Task<GenerationVariant?> RateVariantAsync(Guid devRequestId, Guid variantId, string userId, int rating)
    {
        var variant = await _context.GenerationVariants
            .FirstOrDefaultAsync(v => v.Id == variantId && v.DevRequestId == devRequestId && v.UserId == userId);

        if (variant == null) return null;

        variant.Rating = Math.Clamp(rating, 1, 5);
        await _context.SaveChangesAsync();

        return variant;
    }

    public async Task<bool> DeleteVariantsAsync(Guid devRequestId, string userId)
    {
        var variants = await _context.GenerationVariants
            .Where(v => v.DevRequestId == devRequestId && v.UserId == userId)
            .ToListAsync();

        if (variants.Count == 0) return false;

        _context.GenerationVariants.RemoveRange(variants);
        await _context.SaveChangesAsync();
        return true;
    }

    private static List<VariantFile> GenerateVariantCode(string description, string approach)
    {
        var componentName = ExtractComponentName(description);

        return approach switch
        {
            "minimal" => GenerateMinimalVariant(componentName, description),
            "balanced" => GenerateBalancedVariant(componentName, description),
            "feature-rich" => GenerateFeatureRichVariant(componentName, description),
            _ => GenerateBalancedVariant(componentName, description)
        };
    }

    private static string ExtractComponentName(string description)
    {
        var words = description.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return "App";
        var name = string.Join("", words.Take(3).Select(w =>
            char.ToUpper(w[0]) + (w.Length > 1 ? w[1..].ToLower() : "")));
        return name.Length > 30 ? name[..30] : name;
    }

    private static List<VariantFile> GenerateMinimalVariant(string name, string desc)
    {
        return new List<VariantFile>
        {
            new("src/App.tsx", $@"import {{ useState }} from 'react'

export default function {name}() {{
  const [data, setData] = useState<string[]>([])

  return (
    <div className=""min-h-screen bg-white p-8"">
      <h1 className=""text-2xl font-bold mb-4"">{name}</h1>
      <p className=""text-gray-600 mb-6"">{desc}</p>
      <div className=""space-y-2"">
        {{data.map((item, i) => (
          <div key={{i}} className=""p-3 border rounded"">{{item}}</div>
        ))}}
        {{data.length === 0 && <p className=""text-gray-400"">No items yet</p>}}
      </div>
    </div>
  )
}}"),
            new("src/index.tsx", $@"import {{ createRoot }} from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(<App />)"),
            new("src/index.css", @"@tailwind base;
@tailwind components;
@tailwind utilities;"),
            new("package.json", $@"{{
  ""name"": ""{name.ToLower()}"",
  ""version"": ""1.0.0"",
  ""dependencies"": {{
    ""react"": ""^18.3.0"",
    ""react-dom"": ""^18.3.0""
  }}
}}")
        };
    }

    private static List<VariantFile> GenerateBalancedVariant(string name, string desc)
    {
        return new List<VariantFile>
        {
            new("src/App.tsx", $@"import {{ useState, useCallback }} from 'react'
import {{ Header }} from './components/Header'
import {{ ItemList }} from './components/ItemList'
import {{ AddItemForm }} from './components/AddItemForm'

export interface Item {{
  id: string
  title: string
  createdAt: Date
}}

export default function {name}() {{
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addItem = useCallback((title: string) => {{
    setItems(prev => [
      ...prev,
      {{ id: crypto.randomUUID(), title, createdAt: new Date() }}
    ])
  }}, [])

  const removeItem = useCallback((id: string) => {{
    setItems(prev => prev.filter(item => item.id !== id))
  }}, [])

  return (
    <div className=""min-h-screen bg-gray-50"">
      <Header title=""{name}"" subtitle=""{desc}"" />
      <main className=""max-w-2xl mx-auto p-6 space-y-6"">
        {{error && (
          <div className=""bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"">
            {{error}}
          </div>
        )}}
        <AddItemForm onAdd={{addItem}} disabled={{loading}} />
        <ItemList items={{items}} onRemove={{removeItem}} loading={{loading}} />
      </main>
    </div>
  )
}}"),
            new("src/components/Header.tsx", $@"interface HeaderProps {{
  title: string
  subtitle: string
}}

export function Header({{ title, subtitle }}: HeaderProps) {{
  return (
    <header className=""bg-white border-b px-6 py-4"">
      <h1 className=""text-xl font-semibold text-gray-900"">{{title}}</h1>
      <p className=""text-sm text-gray-500 mt-1"">{{subtitle}}</p>
    </header>
  )
}}"),
            new("src/components/ItemList.tsx", @"import type { Item } from '../App'

interface ItemListProps {
  items: Item[]
  onRemove: (id: string) => void
  loading: boolean
}

export function ItemList({ items, onRemove, loading }: ItemListProps) {
  if (loading) return <div className=""text-center py-8 text-gray-400"">Loading...</div>
  if (items.length === 0) return <div className=""text-center py-8 text-gray-400"">No items yet. Add one above!</div>

  return (
    <div className=""space-y-3"">
      {items.map(item => (
        <div key={item.id} className=""flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow"">
          <div>
            <h3 className=""font-medium text-gray-900"">{item.title}</h3>
            <p className=""text-xs text-gray-400"">{item.createdAt.toLocaleDateString()}</p>
          </div>
          <button onClick={() => onRemove(item.id)} className=""text-red-400 hover:text-red-600 text-sm"">Remove</button>
        </div>
      ))}
    </div>
  )
}"),
            new("src/components/AddItemForm.tsx", @"import { useState } from 'react'

interface AddItemFormProps {
  onAdd: (title: string) => void
  disabled: boolean
}

export function AddItemForm({ onAdd, disabled }: AddItemFormProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className=""flex gap-3"">
      <input
        type=""text""
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder=""Enter item title...""
        className=""flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500""
        disabled={disabled}
      />
      <button
        type=""submit""
        disabled={disabled || !title.trim()}
        className=""px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors""
      >
        Add
      </button>
    </form>
  )
}"),
            new("src/index.tsx", $@"import {{ createRoot }} from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(<App />)"),
            new("src/index.css", @"@tailwind base;
@tailwind components;
@tailwind utilities;"),
            new("package.json", $@"{{
  ""name"": ""{name.ToLower()}"",
  ""version"": ""1.0.0"",
  ""dependencies"": {{
    ""react"": ""^18.3.0"",
    ""react-dom"": ""^18.3.0"",
    ""typescript"": ""^5.5.0"",
    ""tailwindcss"": ""^3.4.0""
  }}
}}")
        };
    }

    private static List<VariantFile> GenerateFeatureRichVariant(string name, string desc)
    {
        return new List<VariantFile>
        {
            new("src/App.tsx", $@"import {{ useState, useCallback, useMemo }} from 'react'
import {{ Header }} from './components/Header'
import {{ ItemList }} from './components/ItemList'
import {{ AddItemForm }} from './components/AddItemForm'
import {{ SearchFilter }} from './components/SearchFilter'
import {{ StatsPanel }} from './components/StatsPanel'
import {{ useLocalStorage }} from './hooks/useLocalStorage'

export interface Item {{
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  createdAt: string
  updatedAt: string
}}

export default function {name}() {{
  const [items, setItems] = useLocalStorage<Item[]>('{name.ToLower()}-items', [])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'priority'>('newest')
  const [error, setError] = useState('')

  const filteredItems = useMemo(() => {{
    let result = items.filter(item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    )
    if (filter === 'active') result = result.filter(i => !i.completed)
    if (filter === 'completed') result = result.filter(i => i.completed)
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (sortBy === 'priority') {{
      const order = {{ high: 0, medium: 1, low: 2 }}
      result.sort((a, b) => order[a.priority] - order[b.priority])
    }}
    return result
  }}, [items, search, filter, sortBy])

  const addItem = useCallback((title: string, description: string, priority: Item['priority']) => {{
    const now = new Date().toISOString()
    setItems(prev => [
      ...prev,
      {{ id: crypto.randomUUID(), title, description, priority, completed: false, createdAt: now, updatedAt: now }}
    ])
  }}, [setItems])

  const toggleItem = useCallback((id: string) => {{
    setItems(prev => prev.map(item =>
      item.id === id ? {{ ...item, completed: !item.completed, updatedAt: new Date().toISOString() }} : item
    ))
  }}, [setItems])

  const removeItem = useCallback((id: string) => {{
    setItems(prev => prev.filter(item => item.id !== id))
  }}, [setItems])

  return (
    <div className=""min-h-screen bg-gray-50"">
      <Header title=""{name}"" subtitle=""{desc}"" itemCount={{items.length}} />
      <main className=""max-w-4xl mx-auto p-6 space-y-6"">
        {{error && (
          <div className=""bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between"">
            <span>{{error}}</span>
            <button onClick={{() => setError('')}} className=""text-red-500 hover:text-red-700"">Dismiss</button>
          </div>
        )}}
        <StatsPanel items={{items}} />
        <AddItemForm onAdd={{addItem}} />
        <SearchFilter search={{search}} onSearch={{setSearch}} filter={{filter}} onFilter={{setFilter}} sortBy={{sortBy}} onSort={{setSortBy}} />
        <ItemList items={{filteredItems}} onToggle={{toggleItem}} onRemove={{removeItem}} />
      </main>
    </div>
  )
}}"),
            new("src/components/Header.tsx", @"interface HeaderProps {
  title: string
  subtitle: string
  itemCount: number
}

export function Header({ title, subtitle, itemCount }: HeaderProps) {
  return (
    <header className=""bg-white border-b px-6 py-4 flex items-center justify-between"">
      <div>
        <h1 className=""text-xl font-semibold text-gray-900"">{title}</h1>
        <p className=""text-sm text-gray-500 mt-1"">{subtitle}</p>
      </div>
      <div className=""bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"">
        {itemCount} items
      </div>
    </header>
  )
}"),
            new("src/components/StatsPanel.tsx", @"import type { Item } from '../App'

interface StatsPanelProps {
  items: Item[]
}

export function StatsPanel({ items }: StatsPanelProps) {
  const completed = items.filter(i => i.completed).length
  const active = items.length - completed
  const highPriority = items.filter(i => i.priority === 'high' && !i.completed).length
  const completionRate = items.length > 0 ? Math.round((completed / items.length) * 100) : 0

  return (
    <div className=""grid grid-cols-2 md:grid-cols-4 gap-4"">
      <div className=""bg-white rounded-lg border p-4"">
        <p className=""text-sm text-gray-500"">Total</p>
        <p className=""text-2xl font-bold text-gray-900"">{items.length}</p>
      </div>
      <div className=""bg-white rounded-lg border p-4"">
        <p className=""text-sm text-gray-500"">Active</p>
        <p className=""text-2xl font-bold text-blue-600"">{active}</p>
      </div>
      <div className=""bg-white rounded-lg border p-4"">
        <p className=""text-sm text-gray-500"">Completed</p>
        <p className=""text-2xl font-bold text-green-600"">{completed} ({completionRate}%)</p>
      </div>
      <div className=""bg-white rounded-lg border p-4"">
        <p className=""text-sm text-gray-500"">High Priority</p>
        <p className=""text-2xl font-bold text-red-600"">{highPriority}</p>
      </div>
    </div>
  )
}"),
            new("src/components/SearchFilter.tsx", @"interface SearchFilterProps {
  search: string
  onSearch: (q: string) => void
  filter: 'all' | 'active' | 'completed'
  onFilter: (f: 'all' | 'active' | 'completed') => void
  sortBy: 'newest' | 'priority'
  onSort: (s: 'newest' | 'priority') => void
}

export function SearchFilter({ search, onSearch, filter, onFilter, sortBy, onSort }: SearchFilterProps) {
  return (
    <div className=""flex flex-col md:flex-row gap-3"">
      <input
        type=""text""
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder=""Search items...""
        className=""flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500""
      />
      <div className=""flex gap-2"">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <select
        value={sortBy}
        onChange={e => onSort(e.target.value as 'newest' | 'priority')}
        className=""px-3 py-2 border rounded-lg bg-white text-sm""
      >
        <option value=""newest"">Newest First</option>
        <option value=""priority"">Priority</option>
      </select>
    </div>
  )
}"),
            new("src/components/ItemList.tsx", @"import type { Item } from '../App'

interface ItemListProps {
  items: Item[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

export function ItemList({ items, onToggle, onRemove }: ItemListProps) {
  if (items.length === 0) return <div className=""text-center py-12 text-gray-400"">No items match your filters</div>

  return (
    <div className=""space-y-3"">
      {items.map(item => (
        <div key={item.id} className={`flex items-start gap-4 p-4 bg-white rounded-lg border hover:shadow-sm transition-all ${item.completed ? 'opacity-60' : ''}`}>
          <input type=""checkbox"" checked={item.completed} onChange={() => onToggle(item.id)} className=""mt-1 w-5 h-5 rounded border-gray-300"" />
          <div className=""flex-1"">
            <h3 className={`font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.title}</h3>
            <p className=""text-sm text-gray-500 mt-1"">{item.description}</p>
            <div className=""flex items-center gap-2 mt-2"">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>{item.priority}</span>
              <span className=""text-xs text-gray-400"">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={() => onRemove(item.id)} className=""text-gray-300 hover:text-red-500 transition-colors"">
            <svg width=""18"" height=""18"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" strokeWidth=""2""><path d=""M18 6L6 18M6 6l12 12""/></svg>
          </button>
        </div>
      ))}
    </div>
  )
}"),
            new("src/components/AddItemForm.tsx", @"import { useState } from 'react'
import type { Item } from '../App'

interface AddItemFormProps {
  onAdd: (title: string, description: string, priority: Item['priority']) => void
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Item['priority']>('medium')
  const [expanded, setExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), description.trim(), priority)
    setTitle('')
    setDescription('')
    setPriority('medium')
    setExpanded(false)
  }

  return (
    <form onSubmit={handleSubmit} className=""bg-white rounded-lg border p-4 space-y-3"">
      <div className=""flex gap-3"">
        <input
          type=""text""
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder=""What needs to be done?""
          className=""flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500""
        />
        <button type=""submit"" disabled={!title.trim()} className=""px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"">Add</button>
      </div>
      {expanded && (
        <div className=""flex gap-3"">
          <input
            type=""text""
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder=""Description (optional)""
            className=""flex-1 px-4 py-2 border rounded-lg text-sm""
          />
          <select value={priority} onChange={e => setPriority(e.target.value as Item['priority'])} className=""px-3 py-2 border rounded-lg text-sm bg-white"">
            <option value=""low"">Low</option>
            <option value=""medium"">Medium</option>
            <option value=""high"">High</option>
          </select>
        </div>
      )}
    </form>
  )
}"),
            new("src/hooks/useLocalStorage.ts", @"import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })

  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(storedValue)) }
    catch { /* ignore */ }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}"),
            new("src/index.tsx", $@"import {{ createRoot }} from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(<App />)"),
            new("src/index.css", @"@tailwind base;
@tailwind components;
@tailwind utilities;"),
            new("package.json", $@"{{
  ""name"": ""{name.ToLower()}"",
  ""version"": ""1.0.0"",
  ""dependencies"": {{
    ""react"": ""^18.3.0"",
    ""react-dom"": ""^18.3.0"",
    ""typescript"": ""^5.5.0"",
    ""tailwindcss"": ""^3.4.0"",
    ""@tanstack/react-query"": ""^5.0.0"",
    ""zustand"": ""^4.5.0"",
    ""lucide-react"": ""^0.400.0""
  }}
}}")
        };
    }

    private static int CountDependencies(List<VariantFile> files, string approach)
    {
        return approach switch
        {
            "minimal" => 2,
            "balanced" => 4,
            "feature-rich" => 7,
            _ => 4
        };
    }

    private static int EstimateBundleSize(string approach, int loc)
    {
        return approach switch
        {
            "minimal" => 45 + loc / 10,
            "balanced" => 85 + loc / 8,
            "feature-rich" => 150 + loc / 6,
            _ => 85 + loc / 8
        };
    }
}

public record VariantFile(string Path, string Content);
