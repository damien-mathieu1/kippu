FROM apache/kafka:3.7.0

USER root

ADD https://github.com/Aiven-Open/tiered-storage-for-apache-kafka/releases/download/v1.0.0/core-1.0.0.tgz /tmp/core.tgz
ADD https://github.com/Aiven-Open/tiered-storage-for-apache-kafka/releases/download/v1.0.0/s3-1.0.0.tgz /tmp/s3.tgz

RUN mkdir -p /opt/kafka/tiered-storage/core /opt/kafka/tiered-storage/s3 && \
    tar xzf /tmp/core.tgz --strip-components=1 -C /opt/kafka/tiered-storage/core && \
    tar xzf /tmp/s3.tgz --strip-components=1 -C /opt/kafka/tiered-storage/s3 && \
    rm /tmp/core.tgz /tmp/s3.tgz && \
    mkdir -p /var/lib/kafka/tiered-storage-cache && \
    chown appuser:appuser /var/lib/kafka/tiered-storage-cache

COPY entrypoint.sh /opt/kafka/entrypoint.sh
RUN chmod +x /opt/kafka/entrypoint.sh

USER appuser

ENTRYPOINT ["/opt/kafka/entrypoint.sh"]
