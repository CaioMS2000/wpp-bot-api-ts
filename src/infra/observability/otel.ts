// Best-effort OpenTelemetry bootstrap. Safe to include in dev/prod.
// Initializes tracing+metrics export via OTLP when OTEL_* envs are set
// and required packages are available. Fails gracefully otherwise.

/* eslint-disable @typescript-eslint/no-var-requires */
import { env } from '@/config/env'

// Export a value to prevent bundlers from tree-shaking this module accidentally
export const __otel_loaded = true

function hasOtelEnv(): boolean {
	const ep =
		env.OTEL_EXPORTER_OTLP_ENDPOINT || env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
	const traces = (env.OTEL_TRACES_EXPORTER || '').toLowerCase()
	return Boolean(ep) && (traces === '' || traces === 'otlp')
}

async function init() {
	if (!hasOtelEnv()) return
	try {
		const [{ NodeSDK }] = await Promise.all([import('@opentelemetry/sdk-node')])

		// Exporters (HTTP) loaded dynamically
		const [{ OTLPTraceExporter }] = await Promise.all([
			import('@opentelemetry/exporter-trace-otlp-http'),
		])

		// Metrics are optional; try to init if exporter is present
		let metricReader: any | undefined
		try {
			const [metrics, mexp] = await Promise.all([
				import('@opentelemetry/sdk-metrics'),
				import('@opentelemetry/exporter-metrics-otlp-http'),
			])
			metricReader = new metrics.PeriodicExportingMetricReader({
				exporter: new mexp.OTLPMetricExporter(),
			})
		} catch {}

		// Auto-instrumentations
		let instrumentations: any[] = []
		try {
			const { getNodeAutoInstrumentations } = await import(
				'@opentelemetry/auto-instrumentations-node'
			)
			instrumentations = [
				getNodeAutoInstrumentations({
					'@opentelemetry/instrumentation-http': { enabled: true },
					'@opentelemetry/instrumentation-fastify': { enabled: true },
					'@opentelemetry/instrumentation-undici': { enabled: true },
					'@opentelemetry/instrumentation-pg': { enabled: true },
				}),
			]
		} catch {}

		const sdk = new NodeSDK({
			traceExporter: new OTLPTraceExporter(),
			metricReader,
			instrumentations,
		})

		await sdk.start()
		// Ensure flush on exit
		const shutdown = () => sdk.shutdown().catch(() => {})
		process.on('beforeExit', shutdown)
		process.on('SIGTERM', shutdown)
		process.on('SIGINT', shutdown)
	} catch (e) {
		// Missing packages or misconfig — ignore silently in runtime, print a hint in dev
		if (process.env.NODE_ENV !== 'production') {
			console.warn('[OTEL] init skipped:', (e as any)?.message || e)
		}
	}
}

void init()
