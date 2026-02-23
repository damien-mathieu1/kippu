# kippu 切符
## Overview
kippu means ticket in Japanese. The goal of this project is to create a simple ticketing system using Kafka, Docker, and TypeScript.

We get messages from fake whatsapp and mail in kafka queues and process them using microservices to create formatted tickets at the end of the day.

## Architecture
**trt stands for traitment (process)**
**all circle rows are queues**
![Architecture](./assets/kippuOverview.png)

## Standardized typing
We use pnpm workspace to manage our microservices and private packages such as shared packages. In shared package we have typescript definitions for our microservices and private packages so every microservice are using common types and interfaces.
