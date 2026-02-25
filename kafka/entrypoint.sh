#!/bin/bash
set -e

GARAGE_ENV_FILE="/shared/garage.env"

echo "Waiting for Garage credentials..."
while [ ! -f "${GARAGE_ENV_FILE}" ]; do
  sleep 2
  echo "  ...still waiting for ${GARAGE_ENV_FILE}"
done

# Source credentials and export them as Kafka RSM config
. "${GARAGE_ENV_FILE}"
export KAFKA_RSM_CONFIG_STORAGE_AWS_ACCESS_KEY_ID="${GARAGE_ACCESS_KEY_ID}"
export KAFKA_RSM_CONFIG_STORAGE_AWS_SECRET_ACCESS_KEY="${GARAGE_SECRET_ACCESS_KEY}"

echo "Garage credentials loaded (key: ${GARAGE_ACCESS_KEY_ID})"

# Delegate to the original Kafka entrypoint
exec /etc/kafka/docker/run
