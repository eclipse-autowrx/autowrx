# Stage 1: Build the React app with Node.js
FROM node:20 AS build

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install the project dependencies
RUN yarn install

# Copy the rest of the project files to the working directory
COPY . .

# Build the project
RUN yarn build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output to the Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration file
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
