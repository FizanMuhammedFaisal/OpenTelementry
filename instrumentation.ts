
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
    ConsoleMetricExporter,
    PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";

// ============================================
// CONFIGURATION
// ============================================

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "otel-poc-app";
const SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION || "1.0.0";
const ENVIRONMENT = process.env.NODE_ENV || "development";

// Jaeger/Collector endpoint (default: Jaeger's OTLP HTTP endpoint)
const OTLP_ENDPOINT =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

// Set to 'console' to log to console, 'otlp' to send to Tempo
const EXPORTER_TYPE = process.env.OTEL_EXPORTER_TYPE || "otlp";

// ============================================
// SETUP EXPORTERS DYNAMICALLY
// ============================================

async function setupOpenTelemetry() {
    // Dynamic imports for ESM compatibility
    let traceExporter;
    let metricExporter;

    if (EXPORTER_TYPE === "console") {
        traceExporter = new ConsoleSpanExporter();
        metricExporter = new ConsoleMetricExporter();
    } else {
        const { OTLPTraceExporter } = await import(
            "@opentelemetry/exporter-trace-otlp-http"
        );
        const { OTLPMetricExporter } = await import(
            "@opentelemetry/exporter-metrics-otlp-http"
        );

        traceExporter = new OTLPTraceExporter({
            url: `${OTLP_ENDPOINT}/v1/traces`,
        });

        metricExporter = new OTLPMetricExporter({
            url: `${OTLP_ENDPOINT}/v1/metrics`,
        });
    }


    const sdk = new NodeSDK({
        serviceName: SERVICE_NAME,

        traceExporter,

        // Metric reader with periodic export (every 10 seconds)
        metricReader: new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 10000, // Export every 10 seconds
        }),

        // Auto-instrumentations for popular libraries
        // This automatically instruments: Express, HTTP, Pino, and more!
        instrumentations: [
            getNodeAutoInstrumentations({
                // Customize specific instrumentations
                "@opentelemetry/instrumentation-pino": {
                    // Inject trace context into Pino logs
                    logHook: (_span, record) => {
                        record["resource.service.name"] = SERVICE_NAME;
                    },
                },
                "@opentelemetry/instrumentation-fs": {
                    enabled: false,
                },
            }),
        ],
    });

    // Start the SDK
    sdk.start();

    console.log(`🔭 OpenTelemetry initialized!`);
    console.log(`   Service: ${SERVICE_NAME} v${SERVICE_VERSION}`);
    console.log(`   Environment: ${ENVIRONMENT}`);
    console.log(
        `   Exporter: ${EXPORTER_TYPE} → ${EXPORTER_TYPE === "otlp" ? OTLP_ENDPOINT : "console"}`,
    );



    const shutdown = async () => {
        console.log("\n🔭 Shutting down OpenTelemetry...");
        try {
            await sdk.shutdown();
            console.log("✅ OpenTelemetry shut down successfully");
        } catch (error) {
            console.error("❌ Error shutting down OpenTelemetry:", error);
        } finally {
            process.exit(0);
        }
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}

// Run setup
setupOpenTelemetry().catch(console.error);
