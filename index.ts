/*
 * Simple Express App with OpenTelemetry
 */

import { SpanStatusCode, trace } from "@opentelemetry/api";
import express, { type Express, type Request, type Response } from "express";
import logger from "./logger.js";

const PORT = parseInt(process.env.PORT || "8080");
const app: Express = express();
const tracer = trace.getTracer("otel-poc-app");

app.use(express.json());

// Request logging
app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, "Request");
    next();
});

// Simple route
app.get("/rolldice", (_req: Request, res: Response) => {
    const result = Math.floor(Math.random() * 6) + 1;
    logger.info({ dice: result }, "Dice rolled");
    res.json({ result });
});

// Route with manual span
app.get("/process", async (_req: Request, res: Response) => {
    await tracer.startActiveSpan("processData", async (span) => {
        span.setAttribute("operation", "demo");

        // Simulate work
        await new Promise((r) => setTimeout(r, 100));
        logger.info("Processing complete");

        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
    });

    res.json({ status: "done" });
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "healthy" });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server: http://localhost:${PORT}`);
    console.log(`📊 Grafana: http://localhost:3000`);
    console.log(`\n Routes: /rolldice, /process, /health\n`);
});
