import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const otelLogLevel = (process.env.OTEL_DIAG_LOG_LEVEL || '').toLowerCase();
if (otelLogLevel) {
  const level =
    otelLogLevel === 'debug'
      ? DiagLogLevel.DEBUG
      : otelLogLevel === 'info'
      ? DiagLogLevel.INFO
      : otelLogLevel === 'error'
      ? DiagLogLevel.ERROR
      : DiagLogLevel.WARN;
  diag.setLogger(new DiagConsoleLogger(), level);
}

const baseEndpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318').replace(/\/$/, '');
const traceEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || `${baseEndpoint}/v1/traces`;
const metricsEndpoint = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || `${baseEndpoint}/v1/metrics`;
const metricInterval = Number(process.env.OTEL_METRIC_EXPORT_INTERVAL_MS || 60000);

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME || process.env.npm_package_name || 'order-service',
    [SemanticResourceAttributes.SERVICE_NAMESPACE]:
      process.env.OTEL_SERVICE_NAMESPACE || 'bookstore',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
  })
);

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({ url: traceEndpoint }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: metricsEndpoint }),
    exportIntervalMillis: metricInterval
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

(async () => {
  try {
    await sdk.start();
    if (process.env.OTEL_STARTUP_LOG !== 'false') {
      console.log('[otel] instrumentation initialized');
    }
  } catch (err) {
    console.error('[otel] failed to start instrumentation', err);
  }
})();

const shutdown = async () => {
  try {
    await sdk.shutdown();
  } catch (err) {
    console.error('[otel] error during shutdown', err);
  }
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

