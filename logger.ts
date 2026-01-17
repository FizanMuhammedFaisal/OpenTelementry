/*
 * Pino Logger sending to Loki directly
 * 
 * Simplified: App → pino-loki → Loki (port 3100)
 * Skipping Alloy for simplicity
 */

import pino from "pino";

const LOKI_HOST = process.env.LOKI_HOST || "http://localhost:3100";
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "otel-poc-app";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        targets: [
            // Console output (pretty)
            {
                target: "pino-pretty",
                level: "info",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                },
            },
            // Loki output (direct to Loki)
            {
                target: "pino-loki",
                level: "info",
                options: {
                    host: LOKI_HOST,
                    labels: {
                        app: SERVICE_NAME,
                        env: process.env.NODE_ENV || "development",
                    },
                    batching: true,
                    interval: 2,
                },
            },
        ],
    },
});

export default logger;
