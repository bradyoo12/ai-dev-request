---
description: Remove tickets in 'Done' status from the project board.
allowed-prompts:
  - tool: Bash
    prompt: run gh commands for GitHub operations
---

Removes all tickets with 'Done' status from the GitHub Project board https://github.com/users/bradyoo12/projects/26.

## Usage
`/b-clean-done`

## Prerequisites

**Before running, ensure the correct GitHub account is active:**

```bash
gh auth switch -u bradyoo12
```

## How It Works

```
┌──────────────────────────────────────────────────┐
│              b-clean-done (Clean Board)           │
├──────────────────────────────────────────────────┤
│  1. Check rate limits                             │
│  2. Fetch all items from project board            │
│  3. Filter items with status = "Done"             │
│  4. Archive each Done item                        │
│  5. Report summary                                │
└──────────────────────────────────────────────────┘
```

## Workflow

### Step 1: Check Rate Limits

Check GitHub API rate limits before making GraphQL calls:

```bash
gh api rate_limit --jq '{
  graphql: .resources.graphql | "GraphQL: \(.remaining)/\(.limit) (resets at \(.reset | strftime("%H:%M:%S")))"
}'
```

If GraphQL remaining < 100, warn the user and ask if they want to proceed.

### Step 2: Fetch Project Items

Fetch all items from the project board:

```bash
gh project item-list 26 --owner bradyoo12 --format json --limit 500 > /tmp/project_items.json
```

**Note:** This command uses GraphQL and counts against the GraphQL API rate limit.

### Step 3: Filter Done Items

Parse the JSON to find all items with status "Done":

```bash
cat /tmp/project_items.json | jq -r '.items[] | select(.status == "Done") | {id: .id, title: .title, number: .number}' > /tmp/done_items.json
```

Count how many items are marked as Done:

```bash
DONE_COUNT=$(cat /tmp/done_items.json | jq -s 'length')
echo "Found $DONE_COUNT items with status 'Done'"
```

If no items found, log "No items in 'Done' status. Nothing to clean." and exit.

### Step 4: Archive Done Items

For each item in `/tmp/done_items.json`, archive it from the project:

```bash
cat /tmp/done_items.json | jq -r '.id' | while read ITEM_ID; do
  # Get the item details for logging
  ITEM_TITLE=$(cat /tmp/done_items.json | jq -r "select(.id == \"$ITEM_ID\") | .title")
  ITEM_NUMBER=$(cat /tmp/done_items.json | jq -r "select(.id == \"$ITEM_ID\") | .number")

  echo "Archiving: #$ITEM_NUMBER - $ITEM_TITLE (ID: $ITEM_ID)"

  # Archive the item from the project
  gh project item-archive 26 --owner bradyoo12 --id "$ITEM_ID"

  # Small delay to avoid rate limiting
  sleep 0.5
done
```

**Note:** `gh project item-archive` removes the item from the project board but does NOT close the issue/PR itself. The issue/PR remains open in the repository.

### Step 5: Report Summary

Log final summary:

```bash
echo "✅ Successfully archived $DONE_COUNT items from the project board."
echo "   - Items are removed from the board but issues/PRs remain in the repository"
echo "   - To view archived items: https://github.com/users/bradyoo12/projects/26?query=is:archived"
```

### Step 6: Cleanup

Remove temporary files:

```bash
rm -f /tmp/project_items.json /tmp/done_items.json
```

## Important Notes

- **This command uses GraphQL** heavily. Each `gh project item-list` and `gh project item-archive` call consumes GraphQL API points.
- **Archive vs Delete**: This command archives items (they can be restored). To permanently delete, use `gh project item-delete` instead of `gh project item-archive`.
- **Issues remain open**: Archiving removes items from the project board but does NOT close the underlying issue or PR. To close issues, use `gh api --method PATCH "repos/bradyoo12/ai-dev-request/issues/N" -f state=closed`.
- **Rate limit awareness**: If you have many Done items (>50), consider running this during off-peak hours to avoid exhausting GraphQL limits.

## Alternative: Close Issues and Archive

If you want to both close the issue AND archive from the project:

```bash
# After archiving, close the issue
ISSUE_NUMBER=$(cat /tmp/done_items.json | jq -r "select(.id == \"$ITEM_ID\") | .number")
gh api --method PATCH "repos/bradyoo12/ai-dev-request/issues/$ISSUE_NUMBER" \
  -f state=closed \
  -f state_reason=completed
```

Add this step after the archive command in Step 4 if desired.
