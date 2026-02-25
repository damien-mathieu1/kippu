# Getting started

## Prerequisites

- Docker and Docker Compose v2
- Node.js >= 18
- pnpm (see `packageManager` in `package.json` for the exact version)

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

These commands require a `.env` file at the project root (see `docker-compose.yml` for the expected variables).
