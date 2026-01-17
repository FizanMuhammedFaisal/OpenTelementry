/*
 * Manual Spans Example
 *
 * This file demonstrates how to create manual spans for custom operations.
 * Use manual spans when:
 * 1. You want to trace business logic
 * 2. Auto-instrumentation doesn't cover your use case
 * 3. You need to add custom attributes or events
 *
 * Run: npx tsx --import ./instrumentation.ts examples/manual-spans.ts
 */

import { context, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

// Get a tracer - this is your entry point for creating spans
const tracer = trace.getTracer("manual-spans-example", "1.0.0");

// ============================================
// EXAMPLE 1: Simple Span
// ============================================

async function simpleSpanExample() {
    console.log("\n📍 Example 1: Simple Span");

    // startActiveSpan automatically:
    // 1. Creates a span
    // 2. Makes it the "active" span (for context propagation)
    // 3. Passes it to your callback
    return tracer.startActiveSpan("simpleOperation", async (span) => {
        try {
            // Add attributes to describe what's happening
            span.setAttribute("example.type", "simple");
            span.setAttribute("example.number", 1);

            // Simulate work
            await sleep(100);

            console.log("   ✅ Simple span created!");
            span.setStatus({ code: SpanStatusCode.OK });
        } finally {
            // IMPORTANT: Always end your spans!
            span.end();
        }
    });
}

// ============================================
// EXAMPLE 2: Nested Spans
// ============================================

async function nestedSpansExample() {
    console.log("\n📍 Example 2: Nested Spans");

    return tracer.startActiveSpan("parentOperation", async (parentSpan) => {
        parentSpan.setAttribute("level", "parent");

        // This child span is automatically linked to parent
        // because we're inside an active span context
        await tracer.startActiveSpan("childOperation1", async (child1) => {
            child1.setAttribute("level", "child");
            child1.setAttribute("childNumber", 1);
            await sleep(50);
            console.log("   ✅ Child span 1 created");
            child1.end();
        });

        // Another child span
        await tracer.startActiveSpan("childOperation2", async (child2) => {
            child2.setAttribute("level", "child");
            child2.setAttribute("childNumber", 2);

            // Grandchild span!
            await tracer.startActiveSpan(
                "grandchildOperation",
                async (grandchild) => {
                    grandchild.setAttribute("level", "grandchild");
                    await sleep(25);
                    console.log("   ✅ Grandchild span created");
                    grandchild.end();
                },
            );

            console.log("   ✅ Child span 2 created");
            child2.end();
        });

        console.log("   ✅ Parent span created with children");
        parentSpan.end();
    });
}

// ============================================
// EXAMPLE 3: Span with Events
// ============================================

async function spanWithEventsExample() {
    console.log("\n📍 Example 3: Span with Events");

    return tracer.startActiveSpan("operationWithEvents", async (span) => {
        // Events are like logs attached to the span
        span.addEvent("Started processing", {
            "event.type": "start",
            timestamp: Date.now(),
        });

        await sleep(50);

        span.addEvent("Checkpoint reached", {
            "event.type": "checkpoint",
            "items.processed": 50,
        });

        await sleep(50);

        span.addEvent("Processing completed", {
            "event.type": "complete",
            "items.total": 100,
        });

        console.log("   ✅ Span with events created");
        span.end();
    });
}

// ============================================
// EXAMPLE 4: Error Handling
// ============================================

async function errorHandlingExample() {
    console.log("\n📍 Example 4: Error Handling");

    return tracer.startActiveSpan("operationThatFails", async (span) => {
        try {
            span.setAttribute("willFail", true);

            await sleep(50);

            // Simulate an error
            throw new Error("Something went wrong in the operation!");
        } catch (error) {
            // Record the exception - this creates a special event
            span.recordException(error as Error);

            // Set the span status to ERROR
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as Error).message,
            });

            console.log(
                "   ✅ Error recorded in span (check Jaeger for red highlight)",
            );
        } finally {
            span.end();
        }
    });
}

// ============================================
// EXAMPLE 5: Different Span Kinds
// ============================================

async function spanKindsExample() {
    console.log("\n📍 Example 5: Span Kinds");

    // SERVER: Incoming request from a client
    await tracer.startActiveSpan(
        "serverSpan",
        {
            kind: SpanKind.SERVER,
        },
        async (span) => {
            span.setAttribute("http.method", "GET");
            span.setAttribute("http.route", "/api/example");
            await sleep(25);
            console.log("   ✅ SERVER span: Represents handling an incoming request");
            span.end();
        },
    );

    // CLIENT: Outgoing request to external service
    await tracer.startActiveSpan(
        "clientSpan",
        {
            kind: SpanKind.CLIENT,
        },
        async (span) => {
            span.setAttribute("http.method", "POST");
            span.setAttribute("http.url", "https://api.example.com/data");
            await sleep(25);
            console.log("   ✅ CLIENT span: Represents making an outgoing request");
            span.end();
        },
    );

    // INTERNAL: Internal operation (default)
    await tracer.startActiveSpan(
        "internalSpan",
        {
            kind: SpanKind.INTERNAL,
        },
        async (span) => {
            span.setAttribute("operation", "businessLogic");
            await sleep(25);
            console.log("   ✅ INTERNAL span: Internal operation");
            span.end();
        },
    );

    // PRODUCER: Publishing to a message queue
    await tracer.startActiveSpan(
        "producerSpan",
        {
            kind: SpanKind.PRODUCER,
        },
        async (span) => {
            span.setAttribute("messaging.system", "kafka");
            span.setAttribute("messaging.destination", "orders-topic");
            await sleep(25);
            console.log("   ✅ PRODUCER span: Publishing a message");
            span.end();
        },
    );

    // CONSUMER: Receiving from a message queue
    await tracer.startActiveSpan(
        "consumerSpan",
        {
            kind: SpanKind.CONSUMER,
        },
        async (span) => {
            span.setAttribute("messaging.system", "kafka");
            span.setAttribute("messaging.source", "orders-topic");
            await sleep(25);
            console.log("   ✅ CONSUMER span: Processing a message");
            span.end();
        },
    );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// RUN ALL EXAMPLES
// ============================================

async function main() {
    console.log("🔭 Manual Spans Examples");
    console.log("========================");
    console.log("Make sure Jaeger is running: docker compose up -d");
    console.log("Then check traces at: http://localhost:16686\n");

    await simpleSpanExample();
    await nestedSpansExample();
    await spanWithEventsExample();
    await errorHandlingExample();
    await spanKindsExample();

    console.log("\n✨ All examples completed!");
    console.log("📊 View traces at: http://localhost:16686");
    console.log("   Select 'manual-spans-example' from the dropdown\n");

    // Wait a bit for traces to be exported before exiting
    await sleep(2000);
}

main().catch(console.error);
