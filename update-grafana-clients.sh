#!/bin/bash

# Array of files to update
files=(
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/folders/[uid]/route.ts"
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/folders/[uid]/permissions/route.ts"
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/dashboards/[uid]/route.ts"
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/dashboards/[uid]/permissions/route.ts"
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/teams/[id]/route.ts"
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/users/[id]/route.ts"
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/users/[id]/teams/route.ts"
    "/home/alenkuriakose/Project Data/DRV-Dash/AI4Voice_Portal/app/api/grafana/users/[id]/dashboards/route.ts"
)

# Pattern to find and replace
find_pattern="const GRAFANA_URL = process\.env\.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_API_KEY = process\.env\.GRAFANA_API_KEY;

const grafanaClient = axios\.create\({
  baseURL: GRAFANA_URL,
  headers: \{
    'Authorization': \`Bearer \${GRAFANA_API_KEY}\`,
    'Content-Type': 'application/json',
  \},
\}\);"

replace_pattern="import grafanaClient from '@/lib/grafana-client';"

echo "Files that will be updated:"
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "- $file"
    else
        echo "- $file (NOT FOUND)"
    fi
done

echo ""
echo "This script will replace Grafana client configurations with a common import."
echo "Press Enter to continue or Ctrl+C to cancel..."
read -r

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Use sed to replace the import section
        sed -i 's/import { NextRequest, NextResponse } from '\''next\/server'\'';/import { NextRequest, NextResponse } from '\''next\/server'\'';/' "$file"
        
        # Remove old imports and client creation, add new import
        awk '
        BEGIN { importing = 0; found_axios = 0; }
        /^import.*axios/ { found_axios = 1; print; next }
        /^const GRAFANA_URL = / { importing = 1; next }
        /^const GRAFANA_API_KEY = / { next }
        /^const grafanaClient = axios\.create/ { importing = 2; next }
        /^  baseURL:/ && importing == 2 { next }
        /^  headers:/ && importing == 2 { next }
        /^    '\''Authorization'\''/ && importing == 2 { next }
        /^    '\''Content-Type'\''/ && importing == 2 { next }
        /^  \},$/ && importing == 2 { next }
        /^\}\);$/ && importing == 2 { 
            if (found_axios) {
                print "import grafanaClient from '\''@/lib/grafana-client'\'';"
                print ""
            }
            importing = 0; 
            next 
        }
        { if (importing == 0) print }
        ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
        
        echo "  ✓ Updated"
    else
        echo "  ✗ File not found: $file"
    fi
done

echo ""
echo "Update complete!"
