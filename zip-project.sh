#!/bin/bash

# --- Task 1: Source Files (Inclusion) ---
# Define the allow-list
FILES=(
  "background"
  "content-scripts"
  "icons"
  "options"
  "src"
  "package.json"
  "package-lock.json"
  "README.md"
  "rollup.config.js"
  "vitest.config.js"
)

echo "📦 Creating fwm.zip from source files..."

# Remove the old zip if it exists to ensure a fresh start
rm -f fwm.zip

# Zip the array
zip -r fwm.zip "${FILES[@]}"

# --- Tasks 2: Browser Distributions ---
# Loop through the target directories
for BROWSER in "firefox" "chromium"; do
  TARGET_DIR="dist/$BROWSER"
  
  # Check if directory exists before trying to zip
  if [ -d "$TARGET_DIR" ]; then
    echo "📦 Creating $BROWSER.zip inside $TARGET_DIR..."
    
    # Enter directory, remove old zip, zip everything inside (.), exclude the zip itself
    (cd "$TARGET_DIR" && rm -f "$BROWSER.zip" && zip -rq "$BROWSER.zip" . -x "$BROWSER.zip")
  else
    echo "⚠️  Warning: $TARGET_DIR not found. Skipping..."
  fi
done

echo "✅ All zips created successfully!"
