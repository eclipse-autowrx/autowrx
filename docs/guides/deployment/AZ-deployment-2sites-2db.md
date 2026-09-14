# AutoWRX Deployment on Azure VM (2 Sites + 2 MongoDB)

Goal: run **two independent AutoWRX sites** on one Azure VM using Docker + Nginx + Let's Encrypt.

* `<domain-a>` → Nginx → `autowrx-<provider-a>` on **3201**
* `<domain-b>` → Nginx → `autowrx-<provider-b>` on **3202**
* Each site uses its **own MongoDB** container + **own volume**
* Each site uses its **own upload/plugin folders**
* Each site has its **own kit-manager** + **multiple runtimes**

> Replace `<provider-a>`, `<provider-b>`, `<domain-a>`, `<domain-b>` with your actual provider names and domains throughout this guide.

---

## 1.0 Azure + DNS prerequisites

### 1.1 Create VM

* Create an Azure Linux VM (Ubuntu recommended) with a Public IP.

### 1.2 Open inbound ports (NSG)

Allow inbound:

* TCP **22** (SSH) (Source Service Tag -> AzureCloud)
* TCP **80** (HTTP)
* TCP **443** (HTTPS)

### 1.3 Configure DNS

Create DNS `A` records:

* `<domain-a>` → `<VM_PUBLIC_IP>`
* `<domain-b>` → `<VM_PUBLIC_IP>`

### 1.4 Validate DNS from your local machine

```bash
nslookup <domain-a>
nslookup <domain-b>
```

---

## 2.0 SSH into the VM + prepare working folder

### 2.1 SSH into the VM

```bash
ssh <user>@<vm_public_ip>
```

### 2.2 Create and enter the deployment folder

```bash
sudo mkdir -p /opt/autowrx
sudo chown -R $USER:$USER /opt/autowrx
cd /opt/autowrx
```

### 2.3 (Optional) Confirm you are in the right place

```bash
pwd
ls -la
```

---

## 3.0 Install Docker + Nginx + Certbot (Ubuntu)

### 3.1 Update packages

```bash
sudo apt update
```

### 3.2 Install Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 3.3 Install Docker + Compose plugin

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3.4 Verify installs

```bash
docker version
docker compose version
nginx -v
certbot --version
```

---

## 4.0 Create directories for each site

### 4.1 Create folders

```bash
cd /opt/autowrx
mkdir -p data/<provider-a>/upload data/<provider-a>/plugin
mkdir -p data/<provider-b>/upload data/<provider-b>/plugin
```

### 4.2 (Optional) show folder layout

```bash
ls -R data
```

---

## 5.0 Create Docker Compose files (one per provider)

Each provider gets its own compose file with app + DB + kit-manager + runtimes.

### 5.1 Create compose file for provider A

```bash
cd /opt/autowrx
nano docker-compose-<provider-a>.yml
```

### 5.2 Paste compose content for provider A

```yaml
# =========================
# <domain-a>
# =========================
services:
  autowrx-<provider-a>:
    container_name: ${NAME:-prod}-autowrx-<provider-a>
    image: autowrx.azurecr.io/<provider-a>/autowrx:<tag>
    ports:
      - "${FRONTEND_PORT_PROVIDER_A:-3201}:3200"
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3200
      MONGODB_URL: mongodb://autowrx-db-<provider-a>:27017/${MONGODB_DATABASE_PROVIDER_A:-autowrx_<provider-a>}
      JWT_SECRET: ${JWT_SECRET}
      JWT_COOKIE_NAME: ${JWT_COOKIE_NAME:-token}
      CORS_ORIGINS: ${CORS_ORIGINS}
      ADMIN_EMAILS: ${ADMIN_EMAILS}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    volumes:
      - "${UPLOAD_PATH_HOST_PROVIDER_A:-./data/<provider-a>/upload}:/usr/src/playground-be/static/uploads"
      - "${PLUGIN_PATH_HOST_PROVIDER_A:-./data/<provider-a>/plugin}:/usr/src/playground-be/static/plugin"
    depends_on:
      autowrx-db-<provider-a>:
        condition: service_healthy
    networks:
      - autowrx-network
    restart: always

  autowrx-db-<provider-a>:
    container_name: ${NAME:-prod}-autowrx-db-<provider-a>
    image: mongo:4.4.6-bionic
    volumes:
      - autowrx-dbdata-<provider-a>:/data/db
    networks:
      - autowrx-network
    restart: always
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')", "--quiet"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 15s

  # =============================================
  # <provider-a> Runtimes
  # =============================================
  <provider-a>-rt-1:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-a>-rt-1
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-a>-runtime-"
      RUNTIME_NAME: "instance-1"
      SYNCER_SERVER_URL: "http://<provider-a>-kit-manager:3090"
    depends_on:
      - <provider-a>-kit-manager
    networks:
      - autowrx-network

  <provider-a>-rt-2:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-a>-rt-2
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-a>-runtime-"
      RUNTIME_NAME: "instance-2"
      SYNCER_SERVER_URL: "http://<provider-a>-kit-manager:3090"
    depends_on:
      - <provider-a>-kit-manager
    networks:
      - autowrx-network

  <provider-a>-rt-3:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-a>-rt-3
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-a>-runtime-"
      RUNTIME_NAME: "instance-3"
      SYNCER_SERVER_URL: "http://<provider-a>-kit-manager:3090"
    depends_on:
      - <provider-a>-kit-manager
    networks:
      - autowrx-network

  <provider-a>-rt-4:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-a>-rt-4
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-a>-runtime-"
      RUNTIME_NAME: "instance-4"
      SYNCER_SERVER_URL: "http://<provider-a>-kit-manager:3090"
    depends_on:
      - <provider-a>-kit-manager
    networks:
      - autowrx-network

  <provider-a>-kit-manager:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-a>-kit-manager
    ports:
      - "127.0.0.1:${KIT_MANAGER_PORT_PROVIDER_A:-3091}:3090"
    environment:
      RUNTIME_NAME: "kit-manager-server"
      SYNCER_SERVER_URL: "http://localhost:3090"
    networks:
      - autowrx-network
    restart: always

volumes:
  autowrx-dbdata-<provider-a>:
    name: ${NAME:-prod}-autowrx-dbdata-<provider-a>

networks:
  autowrx-network:
    name: ${NAME:-prod}-autowrx-network
    driver: bridge
```

### 5.3 Create compose file for provider B

```bash
cd /opt/autowrx
nano docker-compose-<provider-b>.yml
```

### 5.4 Paste compose content for provider B

```yaml
# =========================
# <domain-b>
# =========================
services:
  autowrx-<provider-b>:
    container_name: ${NAME:-prod}-autowrx-<provider-b>
    image: autowrx.azurecr.io/<provider-b>/autowrx:<tag>
    ports:
      - "${FRONTEND_PORT_PROVIDER_B:-3202}:3200"
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3200
      MONGODB_URL: mongodb://autowrx-db-<provider-b>:27017/${MONGODB_DATABASE_PROVIDER_B:-autowrx_<provider-b>}
      JWT_SECRET: ${JWT_SECRET}
      JWT_COOKIE_NAME: ${JWT_COOKIE_NAME:-token}
      CORS_ORIGINS: ${CORS_ORIGINS}
      ADMIN_EMAILS: ${ADMIN_EMAILS}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT}
      AZURE_OPENAI_KEY: ${AZURE_OPENAI_KEY}
      AZURE_OPENAI_DEPLOYMENT: ${AZURE_OPENAI_DEPLOYMENT:-gpt-4o}
    volumes:
      - "${UPLOAD_PATH_HOST_PROVIDER_B:-./data/<provider-b>/upload}:/usr/src/playground-be/static/uploads"
      - "${PLUGIN_PATH_HOST_PROVIDER_B:-./data/<provider-b>/plugin}:/usr/src/playground-be/static/plugin"
    depends_on:
      autowrx-db-<provider-b>:
        condition: service_healthy
    networks:
      - autowrx-network
    restart: always

  autowrx-db-<provider-b>:
    container_name: ${NAME:-prod}-autowrx-db-<provider-b>
    image: mongo:4.4.6-bionic
    volumes:
      - autowrx-dbdata-<provider-b>:/data/db
    networks:
      - autowrx-network
    restart: always
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')", "--quiet"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 15s

  # =============================================
  # <provider-b> Runtimes
  # =============================================
  <provider-b>-rt-1:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-b>-rt-1
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-b>-runtime-"
      RUNTIME_NAME: "instance-1"
      SYNCER_SERVER_URL: "http://<provider-b>-kit-manager:3090"
    depends_on:
      - <provider-b>-kit-manager
    networks:
      - autowrx-network

  <provider-b>-rt-2:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-b>-rt-2
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-b>-runtime-"
      RUNTIME_NAME: "instance-2"
      SYNCER_SERVER_URL: "http://<provider-b>-kit-manager:3090"
    depends_on:
      - <provider-b>-kit-manager
    networks:
      - autowrx-network

  <provider-b>-rt-3:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-b>-rt-3
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-b>-runtime-"
      RUNTIME_NAME: "instance-3"
      SYNCER_SERVER_URL: "http://<provider-b>-kit-manager:3090"
    depends_on:
      - <provider-b>-kit-manager
    networks:
      - autowrx-network

  <provider-b>-rt-4:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-b>-rt-4
    restart: always
    environment:
      RUNTIME_PREFIX: "<provider-b>-runtime-"
      RUNTIME_NAME: "instance-4"
      SYNCER_SERVER_URL: "http://<provider-b>-kit-manager:3090"
    depends_on:
      - <provider-b>-kit-manager
    networks:
      - autowrx-network

  <provider-b>-kit-manager:
    image: ghcr.io/eclipse-autowrx/sdv-runtime:latest
    container_name: ${NAME:-prod}-<provider-b>-kit-manager
    ports:
      - "127.0.0.1:${KIT_MANAGER_PORT_PROVIDER_B:-3090}:3090"
    environment:
      RUNTIME_NAME: "kit-manager-server"
      SYNCER_SERVER_URL: "http://localhost:3090"
    networks:
      - autowrx-network
    restart: always

volumes:
  autowrx-dbdata-<provider-b>:
    name: ${NAME:-prod}-autowrx-dbdata-<provider-b>

networks:
  autowrx-network:
    name: ${NAME:-prod}-autowrx-network
    driver: bridge
```

---

## 6.0 Create `.env.prod`

### 6.1 Create env file

```bash
cd /opt/autowrx
nano .env.prod
```

### 6.2 Paste env content

```env
NAME=autowrx

FRONTEND_PORT_PROVIDER_A=3201
FRONTEND_PORT_PROVIDER_B=3202

KIT_MANAGER_PORT_PROVIDER_A=3091
KIT_MANAGER_PORT_PROVIDER_B=3090

MONGODB_DATABASE_PROVIDER_A=autowrx_<provider-a>
MONGODB_DATABASE_PROVIDER_B=autowrx_<provider-b>

UPLOAD_PATH_HOST_PROVIDER_A=./data/<provider-a>/upload
PLUGIN_PATH_HOST_PROVIDER_A=./data/<provider-a>/plugin

UPLOAD_PATH_HOST_PROVIDER_B=./data/<provider-b>/upload
PLUGIN_PATH_HOST_PROVIDER_B=./data/<provider-b>/plugin

JWT_SECRET=a-secret-password
JWT_COOKIE_NAME=token

CORS_ORIGINS=localhost:\\d+,127\\.0\\.0\\.1:\\d+,<domain-a>,.*\\.<domain-a>,<domain-b>,.*\\.<domain-b>

ADMIN_EMAILS=admin@email.com
ADMIN_PASSWORD=admin123

# Optional: Azure OpenAI (if provider uses GenAI features)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_KEY=
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

> **CORS_ORIGINS** uses regex. Escape dots in domain names with `\\.` (e.g. `example\\.com`).

---

## 7.0 Start Docker services

### 7.1 Start both providers

```bash
cd /opt/autowrx
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod up -d
docker compose -f docker-compose-<provider-b>.yml --env-file .env.prod up -d
```

### 7.2 Check status

```bash
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod ps
docker compose -f docker-compose-<provider-b>.yml --env-file .env.prod ps
```

### 7.3 Verify ports locally

```bash
curl -I http://127.0.0.1:3201/
curl -I http://127.0.0.1:3202/
```

---

## 8.0 Configure Nginx (2 sites reverse proxy)

### 8.1 Create / edit Nginx config

```bash
sudo nano /etc/nginx/sites-available/autowrx-sites.conf
```

### 8.2 Paste config

```nginx
# =============================================
# <domain-a>
# =============================================
server {
    server_name <domain-a>;

    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;
    add_header Cross-Origin-Embedder-Policy "unsafe-none" always;

    # Upload server
    location /upload/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 200m;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_redirect off;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_pass http://127.0.0.1:3201;
    }

    # Kit-manager (WebSocket + HTTP)
    location /<provider-a>-kit/ {
        proxy_pass http://127.0.0.1:3091;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static assets with CORS
    location ~* \.(js|css|map|png|jpg|jpeg|gif|svg|woff2?)$ {
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Vary Origin always;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_pass http://127.0.0.1:3201;
    }

    # API
    location /v2/ {
        proxy_pass http://127.0.0.1:3201;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/<domain-a>/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/<domain-a>/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# =============================================
# <domain-b>
# =============================================
server {
    server_name <domain-b>;

    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;
    add_header Cross-Origin-Embedder-Policy "unsafe-none" always;

    # Upload server
    location /upload/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        client_max_body_size 200m;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_redirect off;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_pass http://127.0.0.1:3202;
    }

    # Kit-manager (WebSocket + HTTP)
    location /<provider-b>-kit/ {
        proxy_pass http://127.0.0.1:3090;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static assets with CORS
    location ~* \.(js|css|map|png|jpg|jpeg|gif|svg|woff2?)$ {
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Vary Origin always;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_pass http://127.0.0.1:3202;
    }

    # API
    location /v2/ {
        proxy_pass http://127.0.0.1:3202;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_http_version 1.1;
        proxy_redirect off;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/<domain-b>/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/<domain-b>/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# HTTP -> HTTPS redirects
server {
    server_name <domain-a>;
    listen 80;
    return 301 https://$host$request_uri;
}

server {
    server_name <domain-b>;
    listen 80;
    return 301 https://$host$request_uri;
}
```

> The `$connection_upgrade` variable must be defined in the `http` block of `/etc/nginx/nginx.conf`:
> ```nginx
> map $http_upgrade $connection_upgrade {
>     default upgrade;
>     ''      close;
> }
> ```

### 8.3 Enable config + disable default site

```bash
sudo ln -s /etc/nginx/sites-available/autowrx-sites.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 8.4 Test + reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9.0 Generate SSL certificates (Let's Encrypt)

```bash
sudo certbot --nginx -d <domain-a> -d <domain-b>
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

---

## 10.0 Validate end-to-end

### 10.1 HTTP redirect

```bash
curl -I http://<domain-a>
curl -I http://<domain-b>
```

### 10.2 HTTPS home pages

```bash
curl -I https://<domain-a>/
curl -I https://<domain-b>/
```

### 10.3 API routing check (example)

```bash
curl -I "https://<domain-b>/v2/permissions/has-permission?permissions=manageUsers"
```

Expected: response from app (often `401`), NOT Nginx HTML 404.

---

## 11.0 Common operations

### 11.1 View Docker logs

```bash
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod logs -f --tail 200
docker compose -f docker-compose-<provider-b>.yml --env-file .env.prod logs -f --tail 200
```

### 11.2 Stop Docker stack (keep DB volumes)

```bash
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod down
docker compose -f docker-compose-<provider-b>.yml --env-file .env.prod down
```

### 11.3 Restart Docker stack after changes

```bash
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod down
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod up -d
```

### 11.4 Wipe DB data (DANGEROUS)

```bash
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod down -v
docker compose -f docker-compose-<provider-a>.yml --env-file .env.prod up -d
```

---

## Notes / Conventions

* Keep sites independent:

  * separate app container
  * separate Mongo container + volume
  * separate upload/plugin folders
  * separate kit-manager + runtimes per provider
* App images are pulled from **Azure Container Registry** (`autowrx.azurecr.io/<provider>/autowrx:<tag>`)
* Runtime images are pulled from **GitHub Container Registry** (`ghcr.io/eclipse-autowrx/sdv-runtime:latest`)
* Kit-manager binds to `127.0.0.1` only — not exposed to the public internet
* Each provider's kit-manager uses a **different host port** to avoid conflicts (e.g. 3090, 3091)
* Runtimes connect to their provider's kit-manager via internal Docker network
* Nginx ports must match Docker host ports:

  * `<domain-a>` → `127.0.0.1:3201`
  * `<domain-b>` → `127.0.0.1:3202`
* Replace all `<...>` placeholders with actual values before running any commands
