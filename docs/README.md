# AutoWRX Developer Documentation

Welcome to the AutoWRX project documentation! This documentation is designed to help developers understand the project structure, architecture, and how to contribute effectively.

## What is AutoWRX?

AutoWRX is a front-end application built with **Vite** and **React**, designed to work with the [digital.auto Playground](https://digital.auto) ecosystem. It provides a dashboard interface to visualize and interact with vehicle signal data, run prototype code, and demonstrate feature concepts using the Vehicle Signal Specification (VSS).

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Yarn
- Docker & Docker Compose

### Local Development
```bash
yarn install
yarn dev
```
Access the application at: [http://localhost:3000](http://localhost:3000)

### Docker Development
```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Documentation Structure

### 📁 [Project Overview](./project-overview.md)
- Project purpose and goals
- Technology stack
- Key features and capabilities
- Architecture overview

### 🏗️ [Project Structure](./project-structure.md)
- Directory organization
- File naming conventions
- Component architecture (Atomic Design)
- Configuration files

### 🛣️ [Routing & Pages](./routing-pages.md)
- Application routes
- Page components
- Layout structure
- Navigation patterns

### 🔌 [API Services](./api-services.md)
- Backend API endpoints
- Service layer architecture
- Authentication and authorization
- Data flow patterns

### 🧩 [Components](./components.md)
- Component library structure
- Reusable components
- Custom hooks
- State management

### 🎨 [Styling & UI](./styling-ui.md)
- CSS architecture
- Tailwind CSS usage
- Design system
- Responsive design

### 🔧 [Development Guide](./development-guide.md)
- Development workflow
- Code standards
- Testing strategies
- Deployment process

### 🚀 [Deployment](./deployment.md)
- Environment configuration
- Docker setup
- Build process
- Production deployment

## Key Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Routing**: React Router DOM
- **UI Components**: Radix UI + Custom components
- **Authentication**: Azure MSAL
- **Real-time**: Socket.IO
- **Charts**: Chart.js
- **Code Editor**: Monaco Editor

## Getting Help

- Check the [Issues](../../issues) for known problems
- Review the [Pull Requests](../../pulls) for recent changes
- Join the project discussions

## Contributing

This project is part of the open-source [digital.auto](https://digital.auto) initiative. Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

## License

**License: [CC BY 4.0 (Creative Commons)](https://creativecommons.org/licenses/by/4.0/)** 