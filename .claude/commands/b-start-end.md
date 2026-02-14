---
description: Gracefully finish the current b-start cycle — merge PRs, verify, close tickets, clean up branches, and stop.
---

Signals a running `/b-start` pipeline to finish its current cycle and stop gracefully. Does NOT process tickets itself — it simply creates a stop signal that b-start checks at the end of each loop iteration.

## Usage
`/b-start-end`

## How It Works

```
┌──────────────────────────────────────────────────┐
│              b-start-end (Stop Signal)            │
├──────────────────────────────────────────────────┤
│  1. Create stop signal file                       │
│  2. Log confirmation                              │
│  3. Done — b-start will finish its current cycle  │
│     and exit instead of picking up a new ticket   │
└──────────────────────────────────────────────────┘
```

## Workflow

### Step 1: Create Stop Signal

Write a stop signal file that b-start checks at the end of each cycle:

```bash
echo "stop-requested-at: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > .claude/b-start-stop-signal
```

### Step 2: Confirm

Log: "Stop signal created. The running b-start pipeline will finish its current cycle and exit gracefully. It will NOT pick up a new ticket."

**That's it. Do NOT:**
- Scan the project board
- Merge PRs
- Move tickets
- Add labels (especially NOT `on hold`)
- Clean up branches
- Run tests

All of that is b-start's responsibility. This command only creates the signal file.

## Important Notes

- **b-start-end does NOT add `on hold` labels** — it never touches tickets
- **b-start-end does NOT process tickets** — it only signals b-start to stop
- **b-start checks for the signal** at the end of each cycle (Step 9 in b-start.md) and exits if found
- **b-start cleans up the signal file** after reading it
- If no b-start is running, the signal file will be cleaned up next time b-start starts
