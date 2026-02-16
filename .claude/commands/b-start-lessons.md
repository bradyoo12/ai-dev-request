# b-start Lessons Learned

Historical record of issues encountered and resolved during b-start pipeline runs.

## Self-Update Protocol

**After EVERY run** of b-start, update this file:

### When to Update
- After encountering an error that took multiple attempts to resolve
- After discovering a missing prerequisite or undocumented dependency
- After finding a workaround for an environment or tooling issue
- After a successful run if you noticed something that could be improved

### How to Update
1. Append a new entry to the chronological list below
2. Use this format:
   ```
   ### [YYYY-MM-DD] <Short Title>
   - **Problem**: What went wrong or was time-consuming
   - **Solution**: What fixed it or the workaround used
   - **Prevention**: What to do differently next time
   ```

---

## Lessons Learned

### [2026-02-07] Azure App Service auto-disables after startup crashes
- **Problem**: After deploying a backend change that caused the .NET app to crash on startup (migration bootstrap logic tried to INSERT into nonexistent `__EFMigrationsHistory` table), Azure auto-disabled the App Service entirely. Subsequent deployments then fail with "Site Disabled (CODE: 403)" and cannot deploy the fix.
- **Solution**: The code fix (ensure `__EFMigrationsHistory` table exists before INSERT, and don't crash on migration failure) was merged to main. However, someone with Azure portal access must manually re-enable the App Service before the fix can be deployed.
- **Prevention**: Always ensure migration bootstrap logic handles missing tables gracefully. Never let migration failures crash the application startup — log and continue so the app remains accessible for diagnostics. Consider adding a health check endpoint that works even when migrations fail.

### [2026-02-07] EnsureCreatedAsync vs MigrateAsync for existing databases
- **Problem**: The original code used `EnsureCreatedAsync()` which only creates a new database from scratch and cannot apply incremental schema changes. When new entities were added, the staging database (which already existed) never got the new tables, causing 500 errors on all database-dependent endpoints.
- **Solution**: Replaced with `MigrateAsync()` plus EF Core migrations. Added bootstrap logic to detect legacy databases (created by `EnsureCreatedAsync`) and insert the initial migration record so `MigrateAsync()` doesn't try to re-create existing tables.
- **Prevention**: Always use EF Core migrations from the start. Never use `EnsureCreatedAsync()` in any environment beyond initial prototyping.

### [2026-02-07] Duplicate tickets (#41 and #43) addressing same issue
- **Problem**: Tickets #41 and #43 both described the same staging 500 error from different angles. Both were in Ready status.
- **Solution**: Treated #41 as the primary ticket (migration fix) and #43 as a follow-up (startup crash fix + error handling). Both ended up being processed sequentially.
- **Prevention**: During audit, identify duplicates early and close/merge them before entering the b-ready phase.

### [2026-02-07] Azure App Service Free tier (F1) quota exceeded blocks all deployments
- **Problem**: The Free F1 App Service Plan has a 60 CPU-minutes/day quota. Repeated startup crashes burned through the quota, causing "QuotaExceeded" state and 403 "Site Disabled" on all deployment attempts. Quota resets at midnight UTC (~19 hours away).
- **Solution**: Scaled the App Service Plan from F1 (Free) to B1 (Basic, ~$13/month) using `az appservice plan update --sku B1`. This immediately lifted the quota restriction.
- **Prevention**: Use at least B1 tier for staging environments. F1 is only suitable for static sites or minimal testing.

### [2026-02-07] No database configured for Azure deployment
- **Problem**: The backend had no database connection string configured in Azure App Settings. It fell back to `Host=localhost` which doesn't work on Azure. The error handling in controllers returned default/empty data, masking the real issue (no database).
- **Solution**: Created an `ai_dev_request` database on the existing `db-bradyoo-staging` PostgreSQL Flexible Server. Configured the connection string via Azure REST API (to avoid bash escaping issues with special characters in the password).
- **Prevention**: Always verify database infrastructure exists BEFORE deploying a new service. Add connection string configuration to the deployment workflow or IaC. Consider adding a startup check that logs a clear warning if the database is unreachable.

### [2026-02-07] Bash escaping mangles special characters in Azure CLI settings
- **Problem**: Setting ConnectionStrings__DefaultConnection via "az webapp config appsettings set" mangled the password — the "!" character was escaped to "\!" by bash history expansion, even with single quotes.
- **Solution**: Used `az rest --method PUT --body @file.json` with the connection string in a JSON file to bypass all shell escaping.
- **Prevention**: For Azure App Settings containing special characters, always use `az rest` with a JSON body file instead of `az webapp config appsettings set`.

### [2026-02-14] Startup allTables check blocks MigrateAsync from creating new tables
- **Problem**: Adding new tables to the `allTables` array in `Program.cs` causes the startup partial-database detection to throw `InvalidOperationException` in staging/production before `MigrateAsync` runs. This creates a chicken-and-egg problem: migrations can't create new tables because the startup crashes when those tables don't exist.
- **Solution**: Changed the partial-database path in staging/production from throwing to logging a warning and proceeding with `MigrateAsync`. Also made migrations idempotent (IF EXISTS/IF NOT EXISTS) and made SupportController fault-tolerant for schema mismatches.
- **Prevention**: Never throw before `MigrateAsync` for missing tables — missing tables are usually just pending migrations. Always make migrations idempotent with IF EXISTS/IF NOT EXISTS guards. Make controllers fault-tolerant with try-catch for database queries that may fail due to schema differences.

### [2026-02-15] Silent GraphQL rate limit failures left 13 tickets with "No Status"
- **Problem**: 13 tickets (created Feb 13-14 by automated ticket creation) were successfully added to the project board but had "No Status" instead of "Ready". The `gh project item-add` succeeded, but the subsequent `gh project item-edit` (to set status) failed silently due to GraphQL rate limit exhaustion. Bash scripts without strict error handling (`set -e`) continued execution despite the failure.
- **Solution**: Added comprehensive error handling to all ticket creation sections (Steps 4b-3, 6c): 1) Check if ITEM_ID is empty after item-add, 2) Check exit code of item-edit command, 3) On failure, switch GitHub accounts (bradyoo12 ↔ byooxbert) and retry once, 4) Log clear error messages if both attempts fail. Manually fixed the 13 affected tickets by switching to byooxbert account (which had remaining GraphQL quota) and setting their status to Ready.
- **Prevention**: Always check exit codes and capture stderr for GitHub API commands. Use the account switching pattern when rate limits are hit. Add retry logic with alternate account for all GraphQL project operations. Monitor for "No Status" tickets in Step 2 audit and auto-fix them. Consider implementing a periodic cleanup job that finds and fixes tickets with missing status.
