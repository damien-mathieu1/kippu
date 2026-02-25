# Architecture

## Data pipeline

Messages arrive from two simulated sources (WhatsApp and email), flow through Kafka topics, get processed by a chain of consumers, and end up as labeled tickets in PostgreSQL. A dashboard reads from the database to display KPIs and time series.

```
Producer
  |
  +---> [whatsapp-msg] ---> whatsapp-consumer --+
  |                                             |
  +---> [mail-msg] ------> mail-consumer -------+
                                                |
                                         [formatted-ticket]
                                                |
                                  formatted-ticket-consumer (LLM)
                                                |
                                        [labelized-ticket]
                                                |
                                  labelized-ticket-consumer ---> PostgreSQL
                                                                     |
                                                               Backend API
                                                                     |
                                                               Frontend dashboard
```

Each processing step has a matching DLQ topic. When a consumer fails to process a message, it publishes it to the corresponding `*-dlq` topic instead of blocking the pipeline.

## Services

### Producer

Generates fake WhatsApp and email messages at a configurable error rate (`ERROR_RATE`) and publishes them to the `whatsapp-msg` and `mail-msg` topics.

### whatsapp-consumer / mail-consumer

Consume raw messages, normalize them into a common ticket format, and publish the result to `formatted-ticket`. Errors are routed to `whatsapp-msg-dlq` or `mail-msg-dlq`.

### formatted-ticket-consumer

Consumes formatted tickets, sends the content to Ollama (llama3.2:1b) for labeling/categorization, and publishes the enriched ticket to `labelized-ticket`. Errors go to `formatted-ticket-dlq`.

### labelized-ticket-consumer

Consumes labeled tickets and persists them to PostgreSQL. Sends a Discord webhook notification on each new ticket. Errors go to `labelized-ticket-dlq`.

### dlq-error-manager

Consumes all DLQ topics, persists error records to PostgreSQL, and sends a Discord webhook notification for each error.

### Backend (API)

Express server exposing REST endpoints for ticket KPIs and DLQ error data, read from PostgreSQL.

### Frontend (dashboard)

React application displaying ticket and DLQ metrics through charts and KPI cards.

## Kafka topics

| Topic                  | Partitions | Replication | Tiered storage | Purpose                              |
|------------------------|------------|-------------|----------------|--------------------------------------|
| `whatsapp-msg`         | 3          | 2           | yes            | Raw WhatsApp messages                |
| `mail-msg`             | 3          | 2           | yes            | Raw email messages                   |
| `formatted-ticket`     | 3          | 2           | yes            | Normalized tickets                   |
| `labelized-ticket`     | 3          | 2           | yes            | LLM-labeled tickets                  |
| `whatsapp-msg-dlq`     | 3          | 2           | no             | Dead letters from whatsapp-consumer  |
| `mail-msg-dlq`         | 3          | 2           | no             | Dead letters from mail-consumer      |
| `formatted-ticket-dlq` | 3          | 2           | no             | Dead letters from formatted-ticket-consumer |
| `labelized-ticket-dlq` | 3          | 2           | no             | Dead letters from labelized-ticket-consumer |

## DLQ system

Every consumer wraps its processing in a try/catch. On failure, the original message plus the error details are published to the matching `-dlq` topic. The `dlq-error-manager` consumer aggregates all DLQ topics, persists errors to PostgreSQL, and notifies via Discord webhook. The dashboard displays DLQ metrics alongside ticket KPIs.
