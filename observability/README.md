# Observability Stack

## Overview
This directory contains the configuration for the Grafana LGTM stack (Loki, Grafana, Tempo, Mimir) plus the OpenTelemetry Collector and Promtail. These services are wired into every Node.js microservice so that logs, traces, and metrics flow into a single observability platform when the Docker Compose environment is running.

## Components
- Grafana (`grafana`): Dashboards and Explore UI on `http://localhost:3001` (`admin/admin` by default).
- Loki (`loki`): Stores container logs received from Promtail on port `3100`.
- Tempo (`tempo`): Receives traces over OTLP gRPC (`4317`) and exposes the search API on `3200`.
- Mimir (`mimir`): Stores metrics sent by the collector on port `9009`.
- OpenTelemetry Collector (`otel-collector`): Ingests OTLP data on `4318` and forwards to Tempo and Mimir.
- Promtail (`promtail`): Scrapes Docker container logs and pushes them to Loki.

## Key Configuration Files
- `otel-collector-config.yaml`: Pipeline definitions for traces and metrics forwarding.
- `loki-config.yml`: Single-process Loki configuration with filesystem storage (`loki-data` volume).
- `tempo-config.yaml`: Tempo setup for trace ingestion and retention.
- `mimir-config.yml`: Mimir single-binary configuration with on-disk storage (`mimir-data` volume).
- `promtail-config.yml`: Targets and scrape jobs for container logs.
- `grafana-provisioning/`: Datasource provisioning so Grafana automatically connects to Loki, Tempo, and Mimir.

## Usage
- `docker compose up -d` (from the project root) starts the entire microservices stack, including observability.
- To start only the observability stack: `docker compose up -d grafana loki tempo mimir otel-collector promtail`.
- Access Grafana at `http://localhost:3001` to view dashboards or explore logs, traces, and metrics.
- Services export telemetry to the collector via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable defined in `docker-compose.yml`. Override it if you run the stack externally.

## Tips
- Persisted volumes (`loki-data`, `tempo-data`, `mimir-data`, `grafana-data`) keep observability data across restarts; remove them for a clean slate.
- Use Grafana Explore with the Loki datasource and query `{job="container-logs"}` to inspect logs.
- Search for traces in Grafana Explore by selecting the Tempo datasource and filtering by `service.name` (for example, `api-gateway`).
- Metrics land in the Mimir datasource; try queries like `http_server_duration_sum` to validate ingestion.

