---
id: ADR-CS-003
title: Kafka Cookbook - Best Practices and Setup Steps
date: 2025-06-11
enforcement:
  tool: code_review
  rule_id: follow_kafka_cook_book
  severity: warning
status: Proposed
---
# Context
Apache Kafka is a high-throughput distributed messaging system used for building real-time data pipelines and streaming applications. To ensure consistency, resilience, and maintainability, teams need a clear, repeatable “cookbook” of steps and best practices when adopting or operating Kafka.

# Decision Drivers
- **Reliability**: Ensuring message delivery guarantees (at-least-once, exactly-once).  
- **Scalability**: Topic partitioning and cluster sizing to handle growth.  
- **Schema Evolution**: Managing data formats without breaking consumers.  
- **Observability**: Monitoring for performance, lag, and failures.  
- **Security**: Encrypting data in motion and controlling access.

# Cookbook Steps

## 1. Provision and Configure Your Kafka Cluster
- **Cluster Sizing**: Determine number of brokers based on expected throughput and replication needs.  
- **Replication Factor & Partitions**: Choose replication factor (≥3) and topic partition count to balance throughput and fault tolerance.  
- **Config Tuning**: Set broker settings (e.g., `log.retention.ms`, `num.network.threads`, `socket.request.max.bytes`) appropriate for workload.

## 2. Define Topics and Schemas
- **Naming Conventions**: Use clear, environment-prefixed names (`dev.orders`, `prod.payments`).  
- **Partition Strategy**: Partition by key (e.g., user ID) to co-locate related messages.  
- **Schema Management**: Use Confluent Schema Registry with Avro/JSON schemas, and enforce compatibility rules (BACKWARD, FORWARD).

## 3. Implement Producers with Resilience
- **Serialization**: Integrate serializer/deserializer pairs matching your schema (e.g., Avro).  
- **Delivery Guarantees**: Enable idempotence (`enable.idempotence=true`) and configure retries/backoff.  
- **Batching & Compression**: Tune `linger.ms`, `batch.size`, and compression (`gzip`/`snappy`) for throughput vs latency.

## 4. Implement Consumers and Group Management
- **Consumer Groups**: Assign unique group IDs and configure rebalancing (`session.timeout.ms`, `max.poll.interval.ms`).  
- **Offset Management**: Decide between auto-commit (for simplicity) or manual commit (for precise control).  
- **Error Handling**: Implement dead-letter topics or retry mechanisms for poison-pill messages.

## 5. Observability, Security, and Operations
- **Metrics & Monitoring**: Collect broker and consumer metrics (e.g., consumer lag, request rates) via JMX; alert on thresholds.  
- **Logging & Tracing**: Correlate producer/consumer logs with message keys for troubleshooting.  
- **Security**: Enable TLS encryption and SASL authentication; define ACLs for topic access control.  
- **Upgrades & Maintenance**: Plan rolling broker upgrades; test upgrade compatibility in a lower environment before production.

# Consequences
- A consistent, repeatable process reduces onboarding time and operational errors.  
- Clear standards for schemas and topic design prevent downstream data quality issues.  
- Built-in resilience and monitoring ensure operational stability at scale.