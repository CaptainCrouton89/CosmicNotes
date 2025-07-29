#!/bin/bash

# TypeScript diagnostics hook for Claude Code
# Runs tsc --noEmit on TypeScript files after they're written

# Read JSON input from stdin
input=$(cat)

# Extract file path from JSON
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Check if file_path is empty or null
if [ -z "$file_path" ] || [ "$file_path" = "null" ]; then
    exit 0
fi

# Check if file is a TypeScript file
if [[ "$file_path" =~ \.(ts|tsx)$ ]]; then
    echo "Running TypeScript diagnostics on: $file_path"
    
    # Run TypeScript compiler in no-emit mode to check for errors
    errors=$(npx tsc --noEmit --project . 2>&1 | grep "$file_path")
    
    # Filter out node_modules and Next.js internal errors
    filtered_errors=$(echo "$errors" | grep -v "node_modules" | grep -v "Cannot find module.*react-server-dom" | grep -v "esModuleInterop" | grep -v "Private identifiers are only available" | grep -v "HeadersIterator" | grep -v "VAR_MODULE_GLOBAL_ERROR")
    
    # Only show errors if there are actual project errors
    if [ -n "$filtered_errors" ]; then
        echo "TypeScript errors in $file_path:" >&2
        echo "$filtered_errors" >&2
        exit 2  # Exit code 2 blocks and shows errors to Claude
    else
        echo "✓ No project TypeScript errors in $file_path"
        exit 0
    fi
fi

# Not a TypeScript file, exit normally
exit 0