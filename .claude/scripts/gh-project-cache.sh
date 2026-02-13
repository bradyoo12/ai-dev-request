#!/bin/bash
# GitHub Project Board Caching Layer
# Reduces GraphQL API calls by caching project board state with smart invalidation

set -euo pipefail

CACHE_DIR="${HOME}/.cache/gh-project"
CACHE_FILE="${CACHE_DIR}/project-26-items.json"
TIMESTAMP_FILE="${CACHE_DIR}/project-26-timestamp"
CACHE_TTL_SECONDS=300  # 5 minutes default TTL

# Ensure cache directory exists
mkdir -p "$CACHE_DIR"

# Function: Get current timestamp
get_timestamp() {
    date +%s
}

# Function: Check if cache is valid
is_cache_valid() {
    local ttl="${1:-$CACHE_TTL_SECONDS}"

    if [[ ! -f "$CACHE_FILE" ]] || [[ ! -f "$TIMESTAMP_FILE" ]]; then
        return 1  # Cache doesn't exist
    fi

    local cache_time
    cache_time=$(cat "$TIMESTAMP_FILE")
    local current_time
    current_time=$(get_timestamp)
    local age=$((current_time - cache_time))

    if [[ $age -lt $ttl ]]; then
        return 0  # Cache is valid
    else
        return 1  # Cache expired
    fi
}

# Function: Fetch fresh data from GitHub
fetch_fresh() {
    echo "[Cache] Fetching fresh project board data from GitHub GraphQL API..." >&2
    gh project item-list 26 --owner "@me" --format json --limit 200 > "$CACHE_FILE"
    get_timestamp > "$TIMESTAMP_FILE"
    echo "[Cache] Fresh data cached (expires in ${CACHE_TTL_SECONDS}s)" >&2
}

# Function: Get cached data
get_cached() {
    cat "$CACHE_FILE"
}

# Function: Invalidate cache (force refresh on next read)
invalidate_cache() {
    echo "[Cache] Cache invalidated - next read will fetch fresh data" >&2
    rm -f "$TIMESTAMP_FILE"
}

# Function: Get project items (with caching)
get_project_items() {
    local force_refresh="${1:-false}"
    local ttl="${2:-$CACHE_TTL_SECONDS}"

    if [[ "$force_refresh" == "true" ]] || ! is_cache_valid "$ttl"; then
        fetch_fresh
    else
        local cache_age
        cache_age=$(($(get_timestamp) - $(cat "$TIMESTAMP_FILE")))
        echo "[Cache] Using cached data (age: ${cache_age}s / ${ttl}s)" >&2
    fi

    get_cached
}

# Main CLI interface
case "${1:-get}" in
    get)
        # Usage: gh-project-cache.sh get [force] [ttl_seconds]
        # Returns cached project items, fetching if needed
        force="${2:-false}"
        ttl="${3:-$CACHE_TTL_SECONDS}"
        get_project_items "$force" "$ttl"
        ;;

    invalidate)
        # Usage: gh-project-cache.sh invalidate
        # Invalidates cache (next get will fetch fresh)
        invalidate_cache
        ;;

    refresh)
        # Usage: gh-project-cache.sh refresh
        # Forces immediate refresh
        fetch_fresh
        get_cached
        ;;

    status)
        # Usage: gh-project-cache.sh status
        # Shows cache status
        if is_cache_valid; then
            cache_age=$(($(get_timestamp) - $(cat "$TIMESTAMP_FILE")))
            echo "Cache status: VALID (age: ${cache_age}s / ${CACHE_TTL_SECONDS}s)"
        else
            echo "Cache status: EXPIRED or MISSING"
        fi
        ;;

    *)
        echo "Usage: gh-project-cache.sh {get|invalidate|refresh|status}" >&2
        echo "" >&2
        echo "Commands:" >&2
        echo "  get [force] [ttl]  - Get project items (default: use cache if valid)" >&2
        echo "  invalidate         - Invalidate cache (force refresh on next get)" >&2
        echo "  refresh            - Force immediate refresh and return data" >&2
        echo "  status             - Show cache validity status" >&2
        exit 1
        ;;
esac
