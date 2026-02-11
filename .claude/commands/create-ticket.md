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

## Step 2: Detect Attached Files and Images

Check if the user's original request (`$ARGUMENTS`) references any files or images:

1. **Scan for file paths**: Look for any file paths, image references, or attachments mentioned in `$ARGUMENTS` or provided in the conversation context (e.g., screenshots, mockups, design files, code snippets, logs)
2. **Classify each file**:
   - **Images** (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`): Will be uploaded and embedded
   - **Text/Code files** (`.ts`, `.js`, `.json`, `.md`, `.txt`, `.log`, `.csv`, etc.): Content will be included inline
   - **Other binary files**: Will be noted in the ticket with instructions to attach manually

3. **If images are found**, upload each to the repository:
   ```powershell
   # Generate a unique filename with timestamp to avoid collisions
   $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
   $filename = "{timestamp}-{original-filename}"

   # Base64 encode the image
   $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("{local-file-path}"))

   # Upload to repo via GitHub Contents API
   gh api --method PUT "repos/bradyoo12/ai-dev-request/contents/.github/issue-assets/$filename" -f message="Add issue asset: $filename" -f content="$base64"
   ```
   The raw URL for referencing will be:
   `https://raw.githubusercontent.com/bradyoo12/ai-dev-request/main/.github/issue-assets/{filename}`

4. **If text/code files are found**, read their content for inclusion in the ticket body.

## Step 3: Create Ticket Content

Create a ticket with the following sections:

### Required Sections
- **Original Request**: The original user input (preserve exact wording)
- **Problem Statement**: Clear description of what needs to be solved
- **Success Criteria**: Specific, measurable acceptance criteria
- **Implementation Guidance**: Helpful direction without being prescriptive
- **Out of Scope**: Explicit boundaries
- **Dependencies**: Related or blocking issues

### Attachments Section (When Files/Images Exist)

If any files or images were detected in Step 2, add an **Attachments** section:

- **For images**: Embed using markdown image syntax:
  ```markdown
  ## Attachments

  ### {descriptive-name}
  ![{descriptive-alt-text}](https://raw.githubusercontent.com/bradyoo12/ai-dev-request/main/.github/issue-assets/{filename})
  ```

- **For text/code files**: Include content in fenced code blocks:
  ```markdown
  ## Attachments

  ### {filename}
  ```{language}
  {file-content}
  ```
  ```

- **For multiple attachments**: List all under the same Attachments section with sub-headings.

### Visual Mockups (When Applicable)

For UI/UX related tickets, include ASCII art mockups (in addition to any uploaded image mockups).

## Step 4: Create GitHub Issue

```bash
gh issue create --repo bradyoo12/ai-dev-request --title "{title}" --body-file {draft-file}
```

## Step 5: Add to AI Dev Request Project and Set Status to Ready

**Important**: The project belongs to the `bradyoo12` GitHub account. Ensure this account is active before running project commands.

```bash
# Switch to bradyoo12 account (project owner)
gh auth switch --user bradyoo12 2>/dev/null || true

# Add issue to project and capture the item ID
ITEM_ID=$(gh project item-add 26 --owner bradyoo12 --url {issue-url} --format json --jq '.id')

# Set status to "Ready" using known project field IDs
# Project ID: PVT_kwHNf9fOATn4hA (AI Dev Request #26)
# Status field: PVTSSF_lAHNf9fOATn4hM4PS3yh
# Ready option: 47fc9ee4
gh project item-edit --project-id PVT_kwHNf9fOATn4hA --id $ITEM_ID --field-id PVTSSF_lAHNf9fOATn4hM4PS3yh --single-select-option-id 47fc9ee4
```

Report the created issue URL and confirm it was added to the project with **Ready** status.

## Important Notes

- All tickets go to `bradyoo12/ai-dev-request` repository
- Create the ticket immediately without asking for confirmation
- **Always include ASCII mockups for UI/UX tickets**
- **Always check for attached files/images** in the user's request before creating the ticket
- Images are uploaded to `.github/issue-assets/` in the repo and referenced via raw URLs
- Text/code file contents are included inline in the ticket body using fenced code blocks
- If an image upload fails (e.g., file not found, API error), note it in the ticket body and continue
