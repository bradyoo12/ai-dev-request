#!/bin/bash
# Check Azure Web App logs for OAuth errors
# Usage: bash check-oauth-logs.sh

echo "Fetching recent logs from ai-dev-request-api..."
az webapp log tail --name ai-dev-request-api --resource-group rg-ai-dev-request --filter "Error" 2>&1

# Alternative: Download logs
# az webapp log download --name ai-dev-request-api --resource-group rg-ai-dev-request --log-file webapp-logs.zip
