#!/bin/bash

# Script to download bewebstudio.digitalauto.tech resources locally
# This script downloads commonly used resources to the simplified flat structure

echo "Downloading bewebstudio.digitalauto.tech resources..."

# Create directory
mkdir -p public/ref

# Download inventory images
echo "Downloading inventory images..."
curl -o public/ref/developer.png "https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/developer.png"
curl -o public/ref/test_manager.png "https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/test%20manager.png"
curl -o public/ref/homologations.png "https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/homologations.png"
curl -o public/ref/security.png "https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/security.png"
curl -o public/ref/OTA_Engineer.png "https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/OTA%20Engineer.png"

# Download type images
echo "Downloading type images..."
curl -o public/ref/ASW_Component.jpg "https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/ASW%20Component.jpg"
curl -o public/ref/ASW_Service.jpg "https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/ASW%20Service.jpg"
curl -o public/ref/ASW_Domain.jpg "https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/ASW%20Domain.jpg"
curl -o public/ref/Country.jpg "https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/Country.jpg"
curl -o public/ref/HARA.jpg "https://bewebstudio.digitalauto.tech/data/projects/Nb7k4JDzL2bh/types/HARA.jpg"

# Download partner logos
echo "Downloading partner logos..."
mkdir -p public/ref/partners
curl -o public/ref/partners/3ds-logo.svg "https://www.3ds.com/assets/3ds-navigation/3DS_corporate-logo_blue.svg"
curl -o public/ref/partners/eclipse-logo.svg "https://www.eclipse.org/eclipse.org-common/themes/solstice/public/images/logo/eclipse-foundation-grey-orange.svg"

echo "Download completed!"
echo "Resources are now available in public/ref/"
echo "Update your code to use local paths starting with /ref/" 