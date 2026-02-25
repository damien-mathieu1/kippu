# Infrastructure

All services are defined in `docker-compose.yml`. Infrastructure services start by default; application services require the `app` profile (`make up-all`).

## Docker services

| Service                      | Image / Build             | Role                                        | Ports          |
|------------------------------|---------------------------|---------------------------------------------|----------------|
| `kafka`                      | custom (./kafka)          | Kafka broker 1 (KRaft)                      | 9092           |
| `kafka2`                     | custom (./kafka)          | Kafka broker 2 (KRaft)                      | 9094           |
| `init-topics`                | apache/kafka:3.7.0        | Creates the 8 Kafka topics then exits       | --             |
| `kafka-ui`                   | kafbat/kafka-ui           | Web UI for Kafka cluster                    | 8080           |
| `postgres`                   | postgres:16               | Relational database for tickets and errors  | 5432           |
| `garage`                     | dxflrs/garage:v2.0.0      | S3-compatible object store                  | 3900, 3902     |
| `init-garage`                | custom (./garage)         | Provisions Garage layout, key, and bucket   | --             |
| `garage-webui`               | garage-webui              | Web UI for Garage                           | 3909           |
| `ollama`                     | ollama/ollama             | LLM inference server                        | 11434          |
| `init-ollama`                | ollama/ollama             | Pulls the llama3.2:1b model then exits      | --             |
| `producer`                   | custom (./producer)       | Message producer (profile: app)             | --             |
| `whatsapp-consumer`          | custom                    | WhatsApp message consumer (profile: app)    | --             |
| `mail-consumer`              | custom                    | Email message consumer (profile: app)       | --             |
| `formatted-ticket-consumer`  | custom                    | LLM labeling consumer (profile: app)        | --             |
| `labelized-ticket-consumer`  | custom                    | Ticket persistence consumer (profile: app)  | --             |
| `dlq-error-manager`          | custom                    | DLQ error consumer (profile: app)           | --             |

## Kafka multi-broker KRaft

The cluster runs two combined broker/controller nodes (no Zookeeper). Both nodes participate in the controller quorum:

```
KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093,2@kafka2:9093
```

Topics are created with `--replication-factor 2` so data is replicated across both brokers.

## Tiered storage

Kafka is configured with [Aiven Tiered Storage](https://github.com/Aiven-Open/tiered-storage-for-apache-kafka) to offload old segments to Garage S3.

Key topic-level settings (set on `whatsapp-msg`, `mail-msg`, `formatted-ticket`, `labelized-ticket`):

| Setting              | Value      | Meaning                                      |
|----------------------|------------|----------------------------------------------|
| `remote.storage.enable` | true    | Activate tiered storage for this topic        |
| `segment.ms`         | 60000      | Roll a new segment every 60 s                |
| `local.retention.ms` | 60000      | Keep segments locally for 60 s after rolling  |
| `retention.ms`       | 604800000  | Total retention: 7 days (including remote)    |

Broker-level settings handle the S3 connection (endpoint, bucket, region, chunking, disk cache).

DLQ topics do not use tiered storage.

## S3 credential provisioning

Kafka brokers need S3 credentials to write to Garage, but those credentials are generated dynamically by `init-garage`. The flow:

1. `garage` starts and exposes its API.
2. `init-garage` runs: assigns a storage layout, creates an API key and a bucket, writes credentials to `/shared/garage.env` (a Docker volume).
3. Each Kafka broker mounts the same volume as read-only and sources the env file at startup via a custom entrypoint (`kafka/entrypoint.sh`), then launches Kafka with the credentials exported.

## Startup order

```
garage
  -> init-garage (waits for garage, writes credentials)
    -> kafka, kafka2 (wait for garage-env volume)
      -> init-topics (waits for both brokers, creates topics)
        -> app services (wait for init-topics + their dependencies)
```

`postgres`, `ollama`, `init-ollama`, `kafka-ui`, and `garage-webui` start independently and have no strict ordering beyond their own `depends_on`.
