# Local Development Setup

This webapp has been configured to run 100% locally, with all external CDN dependencies replaced with local files.

## What's Been Localized

### ✅ Fonts
- **Google Fonts (Inter & Manrope)** → Local font files in `/public/fonts/`
- Font definitions in `/public/css/fonts.css`

### ✅ CSS Libraries
- **React Toastify CSS** → Local file in `/public/css/react-toastify.css`
- **Font Awesome 5.15.3** → Local file in `/public/css/font-awesome-5.15.3.css`
- **Font Awesome 6.4.0** → Local file in `/public/css/font-awesome-6.4.0.css`

### ✅ JavaScript Libraries
- **Tailwind CSS CDN** → Local file in `/public/js/tailwind.min.js`
- **Chart.js** → Local file in `/public/js/chart.js`
- **Syncer.js** → Local mock implementation in `/public/js/syncer.js`

### ✅ Builtin Widgets
All builtin widgets in `/public/builtin-widgets/` now use local resources:
- `single-api/index.html`
- `chart-apis/index.html`
- `image-by-api-value/index.html`
- `table-apis/index.html`
- `simple-fan/index.html`
- `simple-wiper/index.html`

## Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Access the application:**
   - Open http://localhost:3000 in your browser
   - The app will run completely offline except for backend API calls

## Backend Configuration

The webapp still needs a backend service for API calls. Configure your backend URLs using environment variables:

```bash
# Create .env.local file
VITE_SERVER_BASE_URL=http://localhost:8080
VITE_SERVER_BASE_WSS_URL=ws://localhost:8080
VITE_SERVER_VERSION=v2
```

## Mock API Functions

The local `syncer.js` provides mock implementations of:
- `getApiValue(apiName)` - Returns mock vehicle data
- `setApiValue(apiName, value)` - Sets mock vehicle data
- `getAllApiValues()` - Returns all mock data
- `resetApiValues()` - Resets all mock data

This allows widgets to function locally without a real backend.

## File Structure

```
public/
├── css/
│   ├── fonts.css              # Local font definitions
│   ├── react-toastify.css     # Toast notifications
│   ├── font-awesome-5.15.3.css # Icons v5
│   └── font-awesome-6.4.0.css # Icons v6
├── fonts/
│   ├── Inter-roman.var.woff2  # Inter font
│   └── Manrope-roman.var.woff2 # Manrope font
├── js/
│   ├── tailwind.min.js        # Tailwind CSS
│   ├── chart.js              # Chart.js library
│   └── syncer.js             # Mock API functions
└── builtin-widgets/          # All widgets use local resources
```

## Benefits

✅ **No external CDN dependencies** - Works offline  
✅ **Faster loading** - No external network requests  
✅ **Privacy** - No tracking from external services  
✅ **Reliability** - No dependency on external services  
✅ **Development** - Consistent behavior in all environments  

## Notes

- The backend API calls are still external and need to be configured
- Some features may require backend services to function fully
- Mock data is provided for widget testing and development 