#!/bin/bash
set -e

echo "=== Building enowX-Coder .deb package ==="
echo ""

# Check if in correct directory
if [ ! -f "../src-tauri/Cargo.toml" ]; then
    echo "Error: Must run from scripts/ directory"
    exit 1
fi

cd ..

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf src-tauri/target/release/bundle

# Build frontend
echo "Building frontend..."
npm run build

# Build Tauri app with .deb bundle
echo "Building Tauri .deb package..."
cd src-tauri
cargo tauri build --bundles deb
cd ..

echo ""
echo "✓ Build complete!"
echo ""
echo "Package location:"
ls -lh src-tauri/target/release/bundle/deb/*.deb
echo ""
echo "To install:"
echo "  sudo dpkg -i src-tauri/target/release/bundle/deb/enowx-coder_0.2.0_amd64.deb"
echo ""
echo "To test:"
echo "  enowx-coder"
