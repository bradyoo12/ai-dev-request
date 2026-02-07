---
description: Create a GitHub ticket directly without confirmation prompts
argument-hint: <feature/bug description or context>
---

## Mission

Create a GitHub ticket for: $ARGUMENTS

## Step 1: Gather Context

Analyze the requirement and gather codebase context:
1. Search the codebase to understand current state
2. Identify relevant files and patterns
3. Target repository: `bradyoo12/ai-dev-request`

## Step 2: Create Ticket Content

Create a ticket with the following sections:

### Required Sections
- **Original Request**: The original user input (preserve exact wording)
- **Problem Statement**: Clear description of what needs to be solved
- **Success Criteria**: Specific, measurable acceptance criteria
- **Implementation Guidance**: Helpful direction without being prescriptive
- **Out of Scope**: Explicit boundaries
- **Dependencies**: Related or blocking issues

### Visual Mockups (When Applicable)

For UI/UX related tickets, include ASCII art mockups.

## Step 3: Create GitHub Issue

```bash
gh issue create --repo bradyoo12/ai-dev-request --title "{title}" --body-file {draft-file}
```

## Step 4: Add to AI Dev Request Project and Set Status to Ready

```bash
# Add issue to project and capture the item ID
ITEM_ID=$(gh project item-add 26 --owner bradyoo12 --url {issue-url} --format json --jq '.id')

# Get the Status field ID and "Ready" option ID, then set it
STATUS_FIELD_ID=$(gh project field-list 26 --owner bradyoo12 --format json --jq '.fields[] | select(.name=="Status") | .id')
READY_OPTION_ID=$(gh project field-list 26 --owner bradyoo12 --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="Ready") | .id')
gh project item-edit --project-id $(gh project view 26 --owner bradyoo12 --format json --jq '.id') --id $ITEM_ID --field-id $STATUS_FIELD_ID --single-select-option-id $READY_OPTION_ID
```

Report the created issue URL and confirm it was added to the project with **Ready** status.

## Important Notes

- All tickets go to `bradyoo12/ai-dev-request` repository
- Create the ticket immediately without asking for confirmation
- **Always include ASCII mockups for UI/UX tickets**
