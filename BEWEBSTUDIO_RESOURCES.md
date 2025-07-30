# Bewebstudio Resources Localization

## Overview

Resources from `bewebstudio.digitalauto.tech` have been downloaded and served locally from the `/public/ref/` directory using a simplified flat structure.

## Localized Resources

### 📁 Directory Structure
```
public/ref/
├── url-mapping.json                    # URL mapping configuration
├── E-Car_Full_Vehicle.png             # Vehicle image
├── car_full_ed.PNG                     # Vehicle image
├── bosch.png                          # Bosch logo
├── bosch-logo.png                     # Bosch logo (home page)
├── covesa.png                         # COVESA logo
├── university.png                     # University logo
├── Picture1.jpg                       # Inventory role image
├── Picture2.jpg                       # Inventory role image
├── Picture4.jpg                       # Inventory role image
├── Picture5.jpg                       # Inventory role image
├── developer.png                      # Developer role image
├── test_manager.png                   # Test manager role image
├── homologations.png                  # Homologation role image
├── security.png                       # Security role image
├── OTA_Engineer.png                   # OTA engineer role image
├── playground-introduction.png        # News image
├── image.avif                         # Guide image
├── annoucement.jpg                    # Announcement image
├── autowrx.jpg                        # Autowrx image
├── ASW_Component.jpg                  # Type image
├── ASW_Service.jpg                    # Type image
├── ASW_Domain.jpg                     # Type image
├── Country.jpg                        # Type image
├── HARA.jpg                          # Type image
└── partners/                          # Partner logos
    ├── 3ds-logo.svg                   # Dassault Systems logo
    └── eclipse-logo.svg               # Eclipse Foundation logo
```

### 🔄 URL Mappings

| External URL | Local Path |
|--------------|------------|
| `https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/E-Car_Full_Vehicle.png` | `/ref/E-Car_Full_Vehicle.png` |
| `https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/car_full_ed.PNG` | `/ref/car_full_ed.PNG` |
| `https://bewebstudio.digitalauto.tech/data/projects/KlAPnPLdKqnF/Picture1.jpg` | `/ref/Picture1.jpg` |
| `https://www.3ds.com/assets/3ds-navigation/3DS_corporate-logo_blue.svg` | `/ref/partners/3ds-logo.svg` |
| `https://www.eclipse.org/eclipse.org-common/themes/solstice/public/images/logo/eclipse-foundation-grey-orange.svg` | `/ref/partners/eclipse-logo.svg` |
| ... and 24 more mappings |

## Updated Files

### Core Application Files
- ✅ `src/data/models_mock.ts` - Updated vehicle model images
- ✅ `src/components/organisms/ViewApiCovesa.tsx` - Updated vehicle image
- ✅ `instance.ts` - Updated partner logos (including 3DS and Eclipse)
- ✅ `instance/home.tsx` - Updated home page images and partner logos
- ✅ `src/components/molecules/inventory/data.ts` - Updated inventory role images

### Resource Files
- ✅ `public/ref/url-mapping.json` - Complete URL mapping
- ✅ `download-bewebstudio-resources.sh` - Download script for additional resources

## Benefits

✅ **Simplified Structure** - Flat directory structure, no nested folders  
✅ **Offline Access** - All bewebstudio resources work without internet  
✅ **Faster Loading** - No external network requests for images  
✅ **Privacy** - No tracking from external CDN services  
✅ **Reliability** - No dependency on external service availability  
✅ **Development Consistency** - Same behavior across all environments  
✅ **Version Control** - Resources are tracked in your repository  

## Usage

### Accessing Local Resources
```javascript
// Instead of:
const imageUrl = 'https://bewebstudio.digitalauto.tech/data/projects/OezCm7PTy8FT/a/E-Car_Full_Vehicle.png'

// Use:
const imageUrl = '/ref/E-Car_Full_Vehicle.png'
```

### Adding New Resources
1. Download the resource to `public/ref/`
2. Update the URL mapping in `public/ref/url-mapping.json`
3. Update your code to use the local path

### Download Script
Run the download script to get additional resources:
```bash
./download-bewebstudio-resources.sh
```

## Testing

All local resources are accessible via:
- Development: `http://localhost:3001/ref/...`
- Production: `/ref/...`

## Notes

- Total resources localized: **27 files**
- Total size: ~**5.5 MB**
- All images are served with proper MIME types
- Simplified flat structure for easier management
- URL mapping is available for reference and automation 