#!/bin/sh
set -e

GARAGE_ENV_FILE="/shared/garage.env"

echo "Waiting for Garage to be ready..."
until garage status >/dev/null 2>&1; do
  sleep 2
  echo "  ...still waiting"
done
echo "Garage is ready."

# Get this node's ID (node without a role yet)
NODE_ID=$(garage status 2>/dev/null | grep "NO ROLE" | awk '{print $1}')
if [ -z "${NODE_ID}" ]; then
  echo "Node already has a role assigned, skipping layout."
else
  echo "Node ID: ${NODE_ID}"
  echo "Assigning layout..."
  garage layout assign "${NODE_ID}" -z dc1 -c 1G
  garage layout apply --version 1
  echo "Layout applied."
fi

# Create key (idempotent)
if garage key info kafka-tiered-storage >/dev/null 2>&1; then
  echo "Key 'kafka-tiered-storage' already exists, skipping."
else
  echo "Creating API key..."
  garage key create kafka-tiered-storage
fi

# Create bucket (idempotent)
if garage bucket info kafka-tiered-storage >/dev/null 2>&1; then
  echo "Bucket 'kafka-tiered-storage' already exists, skipping."
else
  echo "Creating bucket..."
  garage bucket create kafka-tiered-storage
fi

# Grant permissions (idempotent)
echo "Granting permissions on bucket..."
garage bucket allow --read --write --owner kafka-tiered-storage --key kafka-tiered-storage

# Export credentials to shared volume for Kafka
KEY_ID=$(garage key info kafka-tiered-storage --show-secret 2>/dev/null | grep "Key ID:" | awk '{print $3}')
SECRET_KEY=$(garage key info kafka-tiered-storage --show-secret 2>/dev/null | grep "Secret key:" | awk '{print $3}')

cat > "${GARAGE_ENV_FILE}" <<EOF
GARAGE_ACCESS_KEY_ID=${KEY_ID}
GARAGE_SECRET_ACCESS_KEY=${SECRET_KEY}
EOF

echo ""
echo "Credentials written to ${GARAGE_ENV_FILE}"
echo "  Key ID:     ${KEY_ID}"
echo "  Secret key: ${SECRET_KEY}"
echo ""
echo "Garage initialization complete."
