#!/bin/bash

# Automated Template Generation Script for Star Force Modular
# Usage: ./utils/generate_template.sh assets/png/your-image.png

set -e  # Exit on any error

# Get the project root directory (parent of utils)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if input file is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <path-to-64x64-png-file>"
    print_error "Example: $0 assets/png/new-structure.png"
    print_error "Note: Run this from the project root or it will navigate there automatically"
    exit 1
fi

INPUT_FILE="$1"

# Validate input file exists
if [ ! -f "$INPUT_FILE" ]; then
    print_error "File not found: $INPUT_FILE"
    exit 1
fi

# Extract basename without extension and path
BASENAME=$(basename "$INPUT_FILE" .png)
PNG_DIR=$(dirname "$INPUT_FILE")

print_status "Processing: $INPUT_FILE"
print_status "Base name: $BASENAME"

# Validate required scripts exist
if [ ! -f "utils/split_64x64_png.py" ]; then
    print_error "utils/split_64x64_png.py not found"
    exit 1
fi

if [ ! -f "utils/png_to_json_16x16.py" ]; then
    print_error "utils/png_to_json_16x16.py not found"
    exit 1
fi

# Create directories if they don't exist
mkdir -p assets/sprites
mkdir -p assets/templates

# Backup editor.js before modification
cp editor.js editor.js.bak
print_status "Created backup: editor.js.bak"

# Step 1: Split the 64x64 image into 16 tiles
print_status "Step 1: Splitting image into 16 tiles..."
if ! python utils/split_64x64_png.py "$INPUT_FILE"; then
    print_error "Failed to split image"
    exit 1
fi

# Step 2: Convert each tile to JSON sprite format
print_status "Step 2: Converting tiles to JSON sprites..."
for i in {0..15}; do
    TILE_FILE="${PNG_DIR}/${BASENAME}_part_${i}.png"
    SPRITE_FILE="assets/sprites/${BASENAME}_${i}.json"
    
    if [ ! -f "$TILE_FILE" ]; then
        print_error "Tile file not found: $TILE_FILE"
        exit 1
    fi
    
    if ! python utils/png_to_json_16x16.py "$TILE_FILE" "$SPRITE_FILE" -d "Part ${i} of ${BASENAME} structure"; then
        print_error "Failed to convert $TILE_FILE to JSON"
        exit 1
    fi
    
    # Clean up intermediate tile file
    rm "$TILE_FILE"
done

print_success "Created 16 sprite JSON files"

# Step 3: Create template JSON file
print_status "Step 3: Creating template JSON..."

TEMPLATE_FILE="assets/templates/${BASENAME}_template.json"
TEMPLATE_NAME=$(echo "$BASENAME" | sed 's/_/ /g' | sed 's/\b\w/\u&/g')  # Convert underscores to spaces and capitalize

cat > "$TEMPLATE_FILE" << EOF
{
  "id": "${BASENAME}_complete",
  "name": "${TEMPLATE_NAME} Structure",
  "description": "Complete 4x4 ${TEMPLATE_NAME,,} facility",
  "width": 4,
  "height": 4,
  "tiles": [
    ["${BASENAME}_0", "${BASENAME}_1", "${BASENAME}_2", "${BASENAME}_3"],
    ["${BASENAME}_4", "${BASENAME}_5", "${BASENAME}_6", "${BASENAME}_7"],
    ["${BASENAME}_8", "${BASENAME}_9", "${BASENAME}_10", "${BASENAME}_11"],
    ["${BASENAME}_12", "${BASENAME}_13", "${BASENAME}_14", "${BASENAME}_15"]
  ],
  "category": "structures",
  "previewTile": "${BASENAME}_5"
}
EOF

print_success "Created template: $TEMPLATE_FILE"

# Step 4: Add sprites and template to editor.js
print_status "Step 4: Integrating sprites and template into map editor..."

# Add sprites to spriteNames array
if grep -q "const spriteNames = \[" editor.js; then
    # Check if sprites already exist
    if grep -q "'${BASENAME}_0'" editor.js; then
        print_warning "Sprites for '${BASENAME}' already exist in spriteNames array"
        print_status "Skipping sprite addition to prevent duplicates"
        SPRITES_ADDED=false
    else
        # Find the closing bracket of spriteNames array and insert before it
        SPRITES_END_LINE=$(grep -n -A100 "const spriteNames = \[" editor.js | grep -m1 "^\[0-9\]*-.*\];" | cut -d- -f1)
        
        if [ ! -z "$SPRITES_END_LINE" ]; then
            # Insert each sprite before the closing bracket
            SUCCESS_COUNT=0
            for i in {0..15}; do
                if sed -i "${SPRITES_END_LINE}i\\        '${BASENAME}_${i}'," editor.js; then
                    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
                else
                    break
                fi
            done
            
            if [ $SUCCESS_COUNT -eq 16 ]; then
                print_success "Added 16 sprite names to spriteNames array"
                SPRITES_ADDED=true
            else
                print_warning "Only added $SUCCESS_COUNT sprites to editor.js"
                print_warning "Please manually add remaining sprites to the spriteNames array"
                SPRITES_ADDED=false
            fi
        else
            # Fallback: find last sprite entry manually by looking for 'bigbase_1' (current last entry)
            LAST_SPRITE_LINE=$(grep -n "'bigbase_1'" editor.js | cut -d: -f1)
            if [ ! -z "$LAST_SPRITE_LINE" ]; then
                # Add comma to last entry if missing
                if ! sed -n "${LAST_SPRITE_LINE}p" editor.js | grep -q ",$"; then
                    sed -i "${LAST_SPRITE_LINE}s/$/,/" editor.js
                fi
                
                # Insert new sprites after the last one
                for i in {0..15}; do
                    sed -i "${LAST_SPRITE_LINE}a\\        '${BASENAME}_${i}'," editor.js
                    LAST_SPRITE_LINE=$((LAST_SPRITE_LINE + 1))
                done
                print_success "Added 16 sprite names to spriteNames array"
                SPRITES_ADDED=true
            else
                print_warning "Could not find sprite entries in spriteNames array"
                print_warning "Please manually add sprites '${BASENAME}_0' through '${BASENAME}_15' to the spriteNames array"
                SPRITES_ADDED=false
            fi
        fi
    fi
else
    print_warning "Could not find spriteNames array in editor.js"
    print_warning "Please manually add sprites '${BASENAME}_0' through '${BASENAME}_15' to the spriteNames array"
fi

# Add template to templateNames array
if grep -q "const templateNames = \[" editor.js; then
    # Check if template already exists
    if grep -q "'${BASENAME}_template'" editor.js; then
        print_warning "Template '${BASENAME}_template' already exists in templateNames array"
        print_status "Skipping template addition to prevent duplicates"
        TEMPLATE_ADDED=false
    else
        # Find 'turret_template' (current last entry) and add new template after it
        LAST_TEMPLATE_LINE=$(grep -n "'turret_template'" editor.js | cut -d: -f1)
        
        if [ ! -z "$LAST_TEMPLATE_LINE" ]; then
            # Add comma to last template entry if missing
            if ! sed -n "${LAST_TEMPLATE_LINE}p" editor.js | grep -q ",$"; then
                sed -i "${LAST_TEMPLATE_LINE}s/$/,/" editor.js
            fi
            
            # Insert new template after the last template entry
            if sed -i "${LAST_TEMPLATE_LINE}a\\        '${BASENAME}_template'" editor.js; then
                # Validate JavaScript syntax
                if node -c editor.js 2>/dev/null; then
                    print_success "Added '${BASENAME}_template' to templateNames array"
                    TEMPLATE_ADDED=true
                else
                    print_warning "JavaScript syntax error detected after adding template"
                    print_warning "Restoring backup and providing manual instructions"
                    cp editor.js.bak editor.js
                    print_warning "Please manually add '${BASENAME}_template' to the templateNames array"
                    TEMPLATE_ADDED=false
                fi
            else
                print_warning "Failed to automatically add template to editor.js"
                print_warning "Please manually add '${BASENAME}_template' to the templateNames array"
                TEMPLATE_ADDED=false
            fi
        else
            print_warning "Could not find 'turret_template' in templateNames array"
            print_warning "Please manually add '${BASENAME}_template' to the templateNames array"
            TEMPLATE_ADDED=false
        fi
    fi
else
    print_warning "Could not find templateNames array in editor.js"
    print_warning "Please manually add '${BASENAME}_template' to the templateNames array"
fi

# Summary
print_success "Template generation completed!"
print_status ""
print_status "Generated files:"
print_status "  • 16 sprite files: assets/sprites/${BASENAME}_0.json to ${BASENAME}_15.json"
print_status "  • Template file: $TEMPLATE_FILE"
print_status "  • Backup created: editor.js.bak"
print_status ""

# Show integration status
print_status "Editor.js integration status:"
if [ "${SPRITES_ADDED:-false}" = "true" ]; then
    print_status "  ✅ Sprites: Added 16 sprite entries to spriteNames array"
elif [ "${SPRITES_ADDED:-false}" = "false" ] && grep -q "'${BASENAME}_0'" editor.js; then
    print_status "  ⏭️  Sprites: Skipped (already exist in spriteNames array)"
else
    print_status "  ❌ Sprites: Failed to add - manual integration needed"
fi

if [ "${TEMPLATE_ADDED:-false}" = "true" ]; then
    print_status "  ✅ Template: Added '${BASENAME}_template' to templateNames array"
elif [ "${TEMPLATE_ADDED:-false}" = "false" ] && grep -q "'${BASENAME}_template'" editor.js; then
    print_status "  ⏭️  Template: Skipped (already exists in templateNames array)"
else
    print_status "  ❌ Template: Failed to add - manual integration needed"
fi

print_status ""
if [ "${SPRITES_ADDED:-false}" = "true" ] || [ "${TEMPLATE_ADDED:-false}" = "true" ] || (grep -q "'${BASENAME}_0'" editor.js && grep -q "'${BASENAME}_template'" editor.js); then
    print_success "Your template '${TEMPLATE_NAME} Structure' is available in the map editor!"
else
    print_warning "Manual integration required. Please add missing entries to editor.js"
fi