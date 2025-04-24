#!/bin/bash

set -e

SOURCEFILE=$(mktemp -u /etc/apt/sources.list.d/jammy-webkit.XXXXXX.sources)

cleanup() {
    echo "Cleaning up..."
    sudo rm -f "$SOURCEFILE"
    sudo apt update
}

trap cleanup EXIT

echo "Creating temporary jammy repository source..."
sudo tee "$SOURCEFILE" > /dev/null << 'EOF'
Types: deb
URIs: http://gb.archive.ubuntu.com/ubuntu
Suites: jammy
Components: main universe
Enabled: yes
EOF

echo "Updating package lists..."
sudo apt update

echo "Installing libwebkit2gtk-4.0-dev..."
if ! sudo apt install -y libwebkit2gtk-4.0-dev; then
    echo "Failed to install libwebkit2gtk-4.0-dev"
    exit 1
fi

echo "Success: libwebkit2gtk-4.0-dev is installed."