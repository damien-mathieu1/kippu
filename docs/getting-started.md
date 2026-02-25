# Getting started

## Prerequisites

- Docker and Docker Compose v2
- Node.js >= 18
- pnpm (see `packageManager` in `package.json` for the exact version)

## Environment variables

Copy the example file:

```bash
cp .env.example .env
```

All values in `.env.example` are ready to use as-is for local development, except the Discord webhook URLs which require your own webhooks.

| Variable                   | Default                  | Description                                      |
|----------------------------|--------------------------|--------------------------------------------------|
| `VITE_API_URL`             | `http://localhost:3000`  | Backend API URL used by the React frontend       |
| `KAFKA_BROKERS`            | `localhost:9092,localhost:9094` | Kafka bootstrap servers                    |
| `POSTGRES_HOST`            | `localhost`              | PostgreSQL host                                  |
| `POSTGRES_PORT`            | `5432`                   | PostgreSQL port                                  |
| `POSTGRES_DB`              | `messages`               | PostgreSQL database name                         |
| `POSTGRES_USER`            | `app`                    | PostgreSQL user                                  |
| `POSTGRES_PASSWORD`        | `app`                    | PostgreSQL password                              |
| `AUTO_MIGRATE`             | `true`                   | Auto-create database schema on startup           |
| `OLLAMA_HOST`              | `http://localhost:11434` | Ollama server URL                                |
| `OLLAMA_MODEL`             | `llama3.2:1b`            | LLM model used for ticket labeling               |
| `ERROR_RATE`               | `0.1`                    | Producer error rate for DLQ testing (0.0 to 1.0) |
| `DISCORD_WEBHOOK_URL_ERROR`  | --                     | Discord webhook for error notifications          |
| `DISCORD_WEBHOOK_URL_TICKET` | --                     | Discord webhook for new ticket notifications     |

The Discord webhook URLs are optional. If left empty, the consumers still work but skip the webhook notification. To create a webhook, go to your Discord server settings > Integrations > Webhooks.

When running via Docker (`make up-all`), the `docker-compose.yml` overrides network-related variables (e.g. `KAFKA_BROKERS` becomes `kafka:29092`, `POSTGRES_HOST` becomes `postgres`). The `.env` values are used only for local dev mode (`pnpm run dev:*`).

## Launch the full stack

```bash
make up-all
```

This builds all application images and starts infrastructure + app services. First run will take a few minutes (Kafka init, Ollama model pull).

## Launch the dashboard locally

The dashboard (backend + frontend) can run outside Docker against the Dockerized infrastructure:

```bash
pnpm install
pnpm build
pnpm run dev:dashboard
```

This starts the Express backend and the React frontend concurrently.

## Makefile commands

| Command              | Description                                             |
|----------------------|---------------------------------------------------------|
| `make help`          | Show available commands                                 |
| `make build`         | Build all application Docker images                     |
| `make up-infra`      | Start infrastructure only (Kafka, Postgres, Ollama, Garage) |
| `make up-all`        | Start infrastructure + all application services         |
| `make down`          | Stop and remove all containers                          |
| `make logs`          | Follow logs of all application services                 |
| `make scale-whatsapp N=3` | Scale whatsapp-consumer to N replicas              |

## Exposed ports

| Port  | Service         |
|-------|-----------------|
| 8080  | Kafka UI        |
| 9092  | Kafka broker 1  |
| 9094  | Kafka broker 2  |
| 5432  | PostgreSQL      |
| 3900  | Garage API      |
| 3902  | Garage S3       |
| 3909  | Garage Web UI   |
| 11434 | Ollama          |

## Run individual services locally

Each microservice can be started in dev mode with hot reload:

```bash
pnpm run dev:producer
pnpm run dev:whatsapp-consumer
pnpm run dev:mail-consumer
pnpm run dev:formatted-ticket-consumer
pnpm run dev:labelized-ticket-consumer
pnpm run dev:dlq-error-manager
```

These commands require a `.env` file at the project root (see [Environment variables](#environment-variables) above).
