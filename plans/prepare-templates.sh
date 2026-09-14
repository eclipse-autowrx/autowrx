#!/bin/bash
# Helper script to prepare template files for Coder upload

set -e

echo "Preparing Coder templates for upload..."

# Create zip files for templates
if [ -f "docker-template.tf" ]; then
    echo "Creating docker-template.zip..."
    zip -q docker-template.zip docker-template.tf
    echo "✓ Created docker-template.zip"
else
    echo "⚠ Warning: docker-template.tf not found"
fi

if [ -f "k8s-template.tf" ]; then
    echo "Creating k8s-template.zip..."
    zip -q k8s-template.zip k8s-template.tf
    echo "✓ Created k8s-template.zip"
else
    echo "⚠ Warning: k8s-template.tf not found"
fi

echo ""
echo "Template files are ready for upload to Coder!"
echo "Upload these .zip files in the Coder Dashboard under Templates > Create > Upload"
