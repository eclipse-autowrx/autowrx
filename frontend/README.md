# autowrx

`autowrx` is a front-end application built with **Vite** and **React**, designed to work with the [digital.auto Playground](https://digital.auto) ecosystem. It provides a dashboard interface to visualize and interact with vehicle signal data, run prototype code, and demonstrate feature concepts using the Vehicle Signal Specification (VSS).

---

## Overview

This application enables developers to:

- Interact with vehicle APIs and prototypes  
- Visualize real-time signal data from runtimes  
- Run Python, C++, or Rust-based logic in a containerized environment  
- Connect to the KUKSA Data Broker and other services  
- Showcase customer journeys and feature demos  
- Support both local and Docker-based workflows  

---

## Prerequisites

- Node.js (v18 or higher)
- Yarn

---

## Getting Started

### Local Development

```bash
yarn install
yarn dev
```

Access the application at: [http://localhost:3210](http://localhost:3210)

**Note:** The frontend is now built and served by the backend Docker container. See the root `docker-compose.dev.yml` and `docker-compose.prod.yml` for deployment options.

---

## Project Structure

- `src/` – React components, views, and utilities  
- `vite.config.js` – Vite configuration with aliasing and plugins  

---

## Features

- Real-time signal visualization  
- Execution and debugging of prototype logic  
- Integration with KUKSA Data Broker  
- Modular widget architecture  
- Deployable as a standalone dashboard  

---

## Aliases

- `@` → `./src` (configured in `vite.config.js`)

---

## Bundle Analysis

To analyze the bundle:

```bash
yarn build
```

The visualizer will open automatically after the build completes.

---

## Contributing

This project is part of the open-source [digital.auto](https://digital.auto) initiative. Contributions are welcome.

---

## License

**License: [CC BY 4.0 (Creative Commons)](https://creativecommons.org/licenses/by/4.0/)**  
You are free to share and adapt the material for any purpose, even commercially, with appropriate attribution.
