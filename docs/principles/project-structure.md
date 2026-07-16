# Project structure
```
- project-root
    - backend                           <= domain: https://domain.name
        - static
            - style
                . global.css            <= serve static for frontend
                - fonts                 <= serve static for frontend
        - routes
            - index.js                  <= load frontend
            - api                       <= API
                - site-management
                    . style-apis        <= admin can set/get global.css by this API
                - user-management
                - model-management
                - prototype-management
                - plugin-maangement
        . index.js
        . package.json
    - frontend
        ...
        package.json
    - frontend-dist
        . index.html
        - others....
    . Dockerfile
    . docker-compose.yml
```

This project is organized into two main parts: `backend`, `frontend`

### Root Directory

- **`Dockerfile`**: Defines the environment and steps to build a Docker image for the application, making it easy to deploy.
- **`docker-compose.yml`**: Allows for running the entire application stack, including the backend and potentially other services like databases, with a single command.

### `backend`

This directory contains the server-side application.

- **`static/`**: Holds all static assets that are served directly to the client.
  - **`style/global.css`**: The main stylesheet for the application. It can be dynamically updated by an administrator through the `style-apis`.
  - **`fonts/`**: Contains font files for the application.
- **`routes/`**: Defines all the API endpoints and the main route for serving the frontend.
  - **`index.js`**: The entry point that loads the compiled frontend application (`frontend-dist/index.html`).
  - **`api/`**: Contains the business logic for the application's API, broken down by feature.
    - **`site-management/style-apis.js`**: Handles API requests for updating and retrieving the `global.css` file.
    - **`user-management/`**: Manages user-related operations.
    - **`model-management/`**: Manages model-related operations.
    - **`prototype-management/`**: Manages prototype-related operations.
    - **`plugin-management/`**: Manages plugin-related operations.
- **`index.js`**: The main entry point for the backend server.
- **`package.json`**: Lists the dependencies for the backend application.

### `frontend`

This directory holds the source code for the client-side application (written in React).

- **`package.json`**: Lists the dependencies required for developing the frontend.

### `frontend-dist`

This directory contains the compiled and optimized output from the `frontend` source code. These are the static files that the `backend` serves to users.

- **`index.html`**: The single HTML file that serves as the entry point for the frontend application.
- **`others....`**: Other generated assets like JavaScript bundles, CSS files, and images.
