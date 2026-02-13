# b-start Cache Migration Guide

## Quick Reference: Code Changes

Replace these patterns in b-start.md execution:

### Pattern 1: Initial Fetch (Step 1.5)
```bash
# ❌ OLD - Always hits GraphQL API
PROJECT_ITEMS=$(gh project item-list 26 --owner bradyoo12 --format json --limit 200)

# ✅ NEW - Use cache (5-min TTL)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
```

### Pattern 2: Use Cached Data (Steps 2, 3, 4, 7, 8)
```bash
# ✅ No change - continue using $PROJECT_ITEMS variable
echo "$PROJECT_ITEMS" | jq '.items[] | select(.status.name == "Ready")'
```

### Pattern 3: Verify Claim (Step 3a, after status change)
```bash
# After claiming ticket (changing status to In Progress)
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4

# ❌ OLD - Always re-fetch
PROJECT_ITEMS=$(gh project item-list 26 --owner bradyoo12 --format json --limit 200)

# ✅ NEW - Force refresh (bypasses cache, gets latest state)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get true)
```

### Pattern 4: After Making Changes (Step 4, after merge)
```bash
# After merging PR and changing status to In Review
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id df73e18b

# ✅ NEW - Invalidate cache so next fetch is fresh
bash .claude/scripts/gh-project-cache.sh invalidate
```

### Pattern 5: Re-fetch After Invalidation (Step 5a)
```bash
# ❌ OLD - Re-fetch
PROJECT_ITEMS=$(gh project item-list 26 --owner bradyoo12 --format json --limit 200)

# ✅ NEW - Get (cache was invalidated, will fetch fresh)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
```

## Complete b-start Integration Workflow

```bash
# === STEP 1.5: Fetch Project Board State (Once Per Cycle) ===
echo "Fetching project board state..."
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
bash .claude/scripts/gh-project-cache.sh status  # Optional: show cache status

# === STEP 2: Audit Tickets ===
# Use $PROJECT_ITEMS (no re-fetch)
echo "$PROJECT_ITEMS" | jq '.items[] | select(.type == "Issue")'

# === STEP 3a: Claim Ticket ===
# 1. Find ready ticket from $PROJECT_ITEMS
READY_ITEM=$(echo "$PROJECT_ITEMS" | jq -r '.items[] | select(.status.name == "Ready") | .id' | head -1)

# 2. Claim by changing status (GraphQL mutation)
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $READY_ITEM --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4

# 3. VERIFY claim succeeded - force refresh
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get true)
CLAIMED_STATUS=$(echo "$PROJECT_ITEMS" | jq -r ".items[] | select(.id == \"$READY_ITEM\") | .status.name")
if [[ "$CLAIMED_STATUS" != "In Progress" ]]; then
    echo "Claim failed - another instance claimed this ticket"
    # Skip to next ready ticket
fi

# === STEP 4: Merge PR ===
# ... merge PR logic ...

# After changing status to In Review
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id df73e18b

# Invalidate cache (Step 5 will get fresh data)
bash .claude/scripts/gh-project-cache.sh invalidate

# === STEP 5a: Find In Review Tickets ===
# Cache was invalidated, this will fetch fresh
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
IN_REVIEW=$(echo "$PROJECT_ITEMS" | jq '.items[] | select(.status.name == "In Review")')

# === STEP 8: Report Cycle Status ===
# Use $PROJECT_ITEMS from Step 5a (unless more than 5 min passed, then auto-refreshes)
PROJECT_ITEMS=$(bash .claude/scripts/gh-project-cache.sh get)
echo "Ready: $(echo "$PROJECT_ITEMS" | jq '[.items[] | select(.status.name == "Ready")] | length')"
echo "In Progress: $(echo "$PROJECT_ITEMS" | jq '[.items[] | select(.status.name == "In Progress")] | length')"
echo "In Review: $(echo "$PROJECT_ITEMS" | jq '[.items[] | select(.status.name == "In Review")] | length')"
echo "Done: $(echo "$PROJECT_ITEMS" | jq '[.items[] | select(.status.name == "Done")] | length')"
```

## Monitoring GraphQL Usage

Add this to your b-start logging:

```bash
# At the start of each cycle
echo "=== Cycle Start ==="
bash .claude/scripts/gh-project-cache.sh status
gh api rate_limit --jq '.resources.graphql | "GraphQL: \(.used)/\(.limit) (\(.remaining) remaining)"'

# After claiming/merging (to see impact)
echo "=== After Operation ==="
gh api rate_limit --jq '.resources.graphql | "GraphQL: \(.used)/\(.limit) (\(.remaining) remaining)"'
```

## Expected GraphQL Call Pattern

### Before Caching
```
Cycle N:
  [GraphQL] Step 1.5: Fetch project items (1 call)
  [GraphQL] Step 3a: Re-fetch to verify claim (1 call)
  [GraphQL] Step 3a: Move to In Progress (1 call)
  [GraphQL] Step 4: Move to In Review (1 call)
  [GraphQL] Step 5a: Re-fetch (1 call)
  [GraphQL] Step 8: Re-fetch for reporting (1 call)
Total: 6 GraphQL calls/cycle
```

### After Caching
```
Cycle N (cache cold):
  [GraphQL] Step 1.5: Fetch (1 call) → cache stored
  [Cache]   Step 2: Use cached data (0 calls)
  [GraphQL] Step 3a: Move to In Progress (1 call)
  [GraphQL] Step 3a: Force refresh to verify (1 call) → cache updated
  [GraphQL] Step 4: Move to In Review (1 call)
  [Cache]   Step 4: Invalidate cache (0 calls)
  [GraphQL] Step 5a: Get (1 call, cache invalid) → cache stored
  [Cache]   Step 8: Use cached data (0 calls, still valid)
Total: 5 GraphQL calls (1 call saved)

Cycle N+1 (cache warm):
  [Cache]   Step 1.5: Use cached data (0 calls)
  [Cache]   Step 2: Use cached data (0 calls)
  [GraphQL] Step 3a: Move to In Progress (1 call)
  [GraphQL] Step 3a: Force refresh to verify (1 call) → cache updated
  [GraphQL] Step 4: Move to In Review (1 call)
  [Cache]   Step 4: Invalidate cache (0 calls)
  [GraphQL] Step 5a: Get (1 call, cache invalid) → cache stored
  [Cache]   Step 8: Use cached data (0 calls, still valid)
Total: 4 GraphQL calls (2 calls saved)

Cycles where no tickets processed (idle):
  [Cache]   Step 1.5: Use cached data (0 calls)
  [Cache]   Step 2-8: Skip (no tickets)
Total: 0 GraphQL calls (6 calls saved!)
```

## Cache Tuning

### Aggressive Caching (10-minute TTL)
For less-active projects or when API quota is critical:

```bash
# Change TTL in .claude/scripts/gh-project-cache.sh
CACHE_TTL_SECONDS=600  # 10 minutes
```

**Pros**: Fewer API calls (1-2 per 10 minutes)
**Cons**: Slightly stale data (max 10-minute lag)

### Conservative Caching (2-minute TTL)
For high-activity projects with multiple concurrent instances:

```bash
CACHE_TTL_SECONDS=120  # 2 minutes
```

**Pros**: Fresher data, faster conflict detection
**Cons**: More API calls

### Recommended: 5 minutes (default)
Good balance for most use cases.

## Rollback

If caching causes issues:

```bash
# Clear cache
rm -rf ~/.cache/gh-project/

# Revert all bash .claude/scripts/gh-project-cache.sh calls back to:
gh project item-list 26 --owner bradyoo12 --format json --limit 200
```
