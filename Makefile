.PHONY: help build build-producer build-consumers up up-infra up-all down logs scale-whatsapp

# ── Configuration ─────────────────────────────────────────────────────────────
COMPOSE        = docker compose
COMPOSE_APP    = $(COMPOSE) --profile app

## help: Show this help message
help:
	@grep -E '^##' Makefile | sed 's/## //'

# ── Build ─────────────────────────────────────────────────────────────────────

## build: Build all application images (producer + consumers)
build: build-producer build-consumers

## build-producer: Build the producer image
build-producer:
	docker build -f producer/Dockerfile -t kippu/producer:latest .

## build-consumers: Build all consumer images
build-consumers:
	docker build -f consumer/whatsappMsgConsumer/Dockerfile    -t kippu/whatsapp-consumer:latest .
	docker build -f consumer/mailMsgConsumer/Dockerfile        -t kippu/mail-consumer:latest .
	docker build -f consumer/dlqErrorConsumer/Dockerfile       -t kippu/dlq-error-manager:latest .
	docker build -f consumer/formattedTicketConsumer/Dockerfile -t kippu/formatted-ticket-consumer:latest .
	docker build -f consumer/labelizedTicketConsumer/Dockerfile -t kippu/labelized-ticket-consumer:latest .

# ── Run ───────────────────────────────────────────────────────────────────────

## up-infra: Start infrastructure only (Kafka, Postgres, Ollama, Garage)
up-infra:
	$(COMPOSE) up -d

## up-all: Start infra + all application services
up-all:
	$(COMPOSE_APP) up -d --build

## down: Stop and remove all containers
down:
	$(COMPOSE_APP) down

## logs: Follow logs of all app services
logs:
	$(COMPOSE_APP) logs -f producer whatsapp-consumer mail-consumer formatted-ticket-consumer labelized-ticket-consumer dlq-error-manager

# ── Scaling ───────────────────────────────────────────────────────────────────

## scale-whatsapp N=3: Scale whatsapp-consumer to N replicas (default: 3)
scale-whatsapp:
	$(COMPOSE_APP) up -d --scale whatsapp-consumer=$(or $(N),3)
