# GitHub API Caching Strategy

## Problem

The b-start automation pipeline makes 2-4 GraphQL API calls per cycle to fetch the project board state. With the 5,000 requests/hour GraphQL limit, intensive automation can exhaust the quota in ~2-3 hours of continuous operation.

## Solution

Cache the project board data in a local file with smart invalidation, reducing API calls from 2-4 per cycle to 0-1 per cycle (or even 1 per 5 minutes).

## Cache Implementation

### Location
- **Cache file**: `~/.cache/gh-project/project-26-items.json`
- **Timestamp file**: `~/.cache/gh-project/project-26-timestamp`
- **Script**: `.claude/scripts/gh-project-cache.sh`

### TTL (Time To Live)
- **Default**: 5 minutes (300 seconds)
- **Configurable**: Pass custom TTL as 3rd argument to `get` command

### Usage

#### 1. Get Project Items (Cached)
```bash
# Use cache if valid (< 5 min old), otherwise fetch fresh
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
```

#### 2. Force Refresh
```bash
# Bypass cache and fetch fresh data immediately
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get true)
```

#### 3. Custom TTL
```bash
# Use cache if < 10 minutes old
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get false 600)
```

#### 4. Invalidate Cache
```bash
# Mark cache as invalid (next get will fetch fresh)
bash .claude/scripts/gh-project-cache.sh invalidate
```

#### 5. Check Cache Status
```bash
# See if cache is valid
bash .claude/scripts/gh-project-cache.sh status
```

## Integration with b-start

### Step 1.5: Initial Fetch (Cached)
```bash
# OLD - Always fetches fresh (GraphQL call)
PROJECT_ITEMS=$(gh project item-list 26 --owner bradyoo12 --format json --limit 200)

# NEW - Use cache if valid (0 or 1 GraphQL call)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
```

### Step 2: Audit Tickets (Use Cached Data)
```bash
# No change needed - just use $PROJECT_ITEMS from Step 1.5
echo "$PROJECT_ITEMS" | jq '...'
```

### Step 3a: Verify Claim (Force Refresh)
```bash
# OLD - Always re-fetches (GraphQL call)
PROJECT_ITEMS=$(gh project item-list 26 --owner bradyoo12 --format json --limit 200)

# NEW - Force refresh to verify claim succeeded (1 GraphQL call + invalidate cache)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get true)
```

### Step 4: After Merge (Invalidate Cache)
```bash
# After merging PR and changing ticket status
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id df73e18b

# Invalidate cache so Step 5 gets fresh data
bash .claude/scripts/gh-project-cache.sh invalidate
```

### Step 5a: Find In Review Tickets (Use Cache)
```bash
# OLD - Re-fetch (GraphQL call)
PROJECT_ITEMS=$(gh project item-list 26 --owner bradyoo12 --format json --limit 200)

# NEW - Use cache (cache was invalidated in Step 4, so this will fetch fresh once)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
```

### Step 8: Final Report (Use Cached Data)
```bash
# OLD - Re-fetch (GraphQL call)
PROJECT_ITEMS=$(gh project item-list 26 --owner bradyoo12 --format json --limit 200)

# NEW - Use cache from Step 5a (0 GraphQL calls if < 5 min old)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
```

## Cache Invalidation Rules

**Invalidate cache (mark stale) after:**
- ✅ Moving a ticket to a new status (In Progress, In Review, Done)
- ✅ Adding a ticket to the project
- ✅ Adding/removing labels that affect filtering (`on hold`)

**Do NOT invalidate after:**
- ❌ Reading ticket details (REST API, doesn't change project board)
- ❌ Creating/merging PRs (doesn't change project board status)
- ❌ Running tests or builds

## Expected Impact

### Before Caching (Current State)
```
Cycle 1: 4 GraphQL calls (fetch x3, status change x1)
Cycle 2: 4 GraphQL calls
Cycle 3: 4 GraphQL calls
...
Total per hour (15 cycles): 60 GraphQL calls
```

### After Caching (With Smart Invalidation)
```
Cycle 1: 1 GraphQL call (initial fetch, cache for 5 min)
Cycle 2: 0 GraphQL calls (use cache)
Cycle 3: 0 GraphQL calls (use cache)
Cycle 4: 0 GraphQL calls (use cache, still valid)
Cycle 5: 1 GraphQL call (cache expired, refresh)
...
Total per hour (15 cycles): 3-4 GraphQL calls
```

**Reduction: 93-95% fewer GraphQL calls**

## Multi-Instance Considerations

The cache is stored in `~/.cache/gh-project/` which is **user-local**, not worktree-local.

### Same Machine, Multiple Worktrees
- ✅ All instances share the same cache
- ✅ One instance refreshes, all benefit
- ✅ Race conditions are unlikely (5-minute TTL provides plenty of buffer)

### Multiple Machines
- ❌ Each machine has its own cache
- ⚠️ Potential for stale reads if Machine A claims a ticket and Machine B's cache hasn't refreshed yet
- ✅ Mitigated by short 5-minute TTL - worst case is 5-minute delay before other machines see changes

### Claim Race Protection (Built-in)

The claim verification in Step 3a **always forces a refresh**, so even with caching:
1. Machine A fetches cached list (may be stale)
2. Machine A claims ticket #123 by changing status to "In Progress"
3. Machine A **force-refreshes** cache to verify claim
4. If Machine B already claimed #123, Machine A sees "In Progress" and skips
5. No duplicate work even with stale cache

## Troubleshooting

### Cache stuck/corrupted
```bash
# Clear cache and force fresh fetch
rm -rf ~/.cache/gh-project/
bash .claude/scripts/gh-project-cache.sh refresh
```

### Check cache age
```bash
bash .claude/scripts/gh-project-cache.sh status
# Output: Cache status: VALID (age: 137s / 300s)
```

### Manually refresh cache
```bash
bash .claude/scripts/gh-project-cache.sh refresh
```

## Configuration

To change the default TTL, edit `.claude/scripts/gh-project-cache.sh`:

```bash
CACHE_TTL_SECONDS=300  # Change to 600 for 10 minutes, etc.
```

Or pass custom TTL per-call:
```bash
# Cache valid for 10 minutes
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get false 600)
```

## Monitoring

Add cache status logging to b-start cycles:

```bash
# At the start of Step 1.5
echo "=== Cache Status ==="
bash .claude/scripts/gh-project-cache.sh status

# After fetching
echo "=== GraphQL Usage ==="
gh api rate_limit --jq '.resources.graphql | "Used: \(.used)/\(.limit) (Remaining: \(.remaining))"'
```
