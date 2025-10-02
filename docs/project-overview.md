# Project Overview

## Purpose & Goals

AutoWRX is a comprehensive dashboard application designed for the automotive industry, specifically built to work with the [digital.auto Playground](https://digital.auto) ecosystem. The application serves as a central hub for:

- **Vehicle Signal Visualization**: Real-time display of vehicle data using Vehicle Signal Specification (VSS)
- **Prototype Development**: Running and testing Python, C++, or Rust-based logic in containerized environments
- **API Management**: Interacting with vehicle APIs and managing API configurations
- **Model Management**: Creating and managing vehicle models with their associated APIs and prototypes
- **Dashboard Creation**: Building custom dashboards with widgets and real-time data visualization
- **Collaboration**: Sharing models, prototypes, and dashboards with team members

## Key Features

### 🚗 Vehicle Signal Management
- Real-time signal visualization from vehicle runtimes
- Integration with KUKSA Data Broker
- Support for multiple VSS versions (v3.0 to v5.0)
- Signal filtering and search capabilities

### 🔧 Prototype Development
- Multi-language support (Python, C++, Rust)
- Containerized execution environment
- Code editor with syntax highlighting
- Real-time debugging and logging
- Prototype sharing and collaboration

### 📊 Dashboard & Widgets
- Modular widget architecture
- Built-in widget library (charts, tables, maps, etc.)
- Custom widget development
- Real-time data binding
- Responsive design

### 👥 User Management
- Role-based access control
- User invitation system
- Permission management
- SSO integration (Azure AD, GitHub)

### 🏗️ Model Architecture
- Vehicle model creation and management
- API configuration and testing
- Architecture visualization
- Model sharing and collaboration

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives

### State Management
- **Zustand**: Lightweight state management
- **React Query**: Server state management and caching
- **React Router**: Client-side routing

### UI & Visualization
- **Chart.js**: Data visualization
- **Monaco Editor**: Code editing
- **React Konva**: Canvas-based graphics
- **Socket.IO**: Real-time communication

### Authentication & Security
- **Azure MSAL**: Microsoft authentication
- **JWT**: Token-based authentication
- **CORS**: Cross-origin resource sharing

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **TypeScript**: Type checking

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (AutoWRX)     │◄──►│   Services      │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌─────▼────┐            ┌─────▼────┐
    │ Browser │            │ API      │            │ KUKSA    │
    │ Storage │            │ Gateway  │            │ Data     │
    └─────────┘            └──────────┘            │ Broker   │
                                                   └──────────┘
```

### Component Architecture

The application follows the **Atomic Design** methodology:

1. **Atoms**: Basic building blocks (buttons, inputs, labels)
2. **Molecules**: Simple combinations of atoms (forms, search bars)
3. **Organisms**: Complex UI components (dashboards, navigation)
4. **Templates**: Page layouts and structure
5. **Pages**: Complete user interfaces

### Data Flow

1. **User Interaction**: User interacts with React components
2. **State Update**: Local state updated via Zustand or React Query
3. **API Call**: Service layer makes HTTP requests to backend
4. **Data Processing**: Backend processes request and returns response
5. **UI Update**: Components re-render with new data
6. **Real-time Updates**: Socket.IO provides live data updates

## Key Concepts

### Vehicle Signal Specification (VSS)
VSS is a standardized way to describe vehicle signals. AutoWRX supports multiple VSS versions and provides tools to:
- Browse VSS catalogs
- Map signals to APIs
- Validate signal configurations
- Generate API documentation

### Model-View-Controller (MVC) Pattern
The application loosely follows MVC patterns:
- **Models**: Data structures and business logic
- **Views**: React components and UI
- **Controllers**: Service layer and state management

### Containerization
Prototypes run in isolated containers to ensure:
- Security and isolation
- Consistent execution environment
- Resource management
- Easy deployment

## Integration Points

### Backend Services
- **Core API**: Main application backend
- **Cache Service**: Data caching and performance
- **Log Service**: Application logging
- **Upload Service**: File uploads and storage
- **Studio Service**: Code compilation and execution

### External Services
- **KUKSA Data Broker**: Vehicle signal data
- **GitHub**: Source code management
- **Azure AD**: Authentication
- **Digital.auto Marketplace**: Widget and addon marketplace

## Performance Considerations

- **Code Splitting**: Lazy loading of routes and components
- **Caching**: React Query for API response caching
- **Bundle Optimization**: Vite for fast builds and HMR
- **Image Optimization**: Responsive images and lazy loading
- **Real-time Updates**: Efficient WebSocket connections

## Security Features

- **Authentication**: Multi-provider SSO support
- **Authorization**: Role-based access control
- **CORS**: Cross-origin request handling
- **Input Validation**: Client and server-side validation
- **Secure Headers**: HTTPS and security headers 