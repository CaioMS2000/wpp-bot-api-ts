import { logger } from './logger'

type Labels = Record<string, string | number | boolean | null | undefined>

const counters = new Map<string, number>()

function key(name: string, labels?: Labels): string {
	if (!labels) return name
	const parts = Object.entries(labels)
		.filter(([, v]) => v !== undefined)
		.sort(([a], [b]) => (a < b ? -1 : 1))
		.map(([k, v]) => `${k}=${String(v)}`)
	return parts.length ? `${name}{${parts.join(',')}}` : name
}

export function inc(name: string, labels?: Labels, by = 1): void {
	const k = key(name, labels)
	counters.set(k, (counters.get(k) || 0) + by)
}

let reporterStarted = false
export function startMetricsReporter(intervalMs = 60_000): void {
	if (reporterStarted) return
	reporterStarted = true
	setInterval(() => {
		const snapshot = Array.from(counters.entries())
		counters.clear()
		if (!snapshot.length) return
		// Log all counters as one record for easy aggregation
		const data: Record<string, number> = {}
		for (const [k, v] of snapshot) data[k] = v
		logger.info('metrics_flush', { component: 'metrics', counters: data })
		// Minimal alerts
		const openai429 = Object.entries(data)
			.filter(([n]) => n.startsWith('openai_429_total'))
			.reduce((acc, [, v]) => acc + v, 0)
		const openaiErr = Object.entries(data)
			.filter(([n]) => n.startsWith('openai_error_total'))
			.reduce((acc, [, v]) => acc + v, 0)
		const wppErr = Object.entries(data)
			.filter(([n]) => n.startsWith('whatsapp_send_error'))
			.reduce((acc, [, v]) => acc + v, 0)
		if (openai429 >= 5) {
			logger.warn('alert_openai_rate_limited', {
				component: 'metrics',
				count: openai429,
			})
		}
		if (openaiErr >= 10) {
			logger.warn('alert_openai_errors_high', {
				component: 'metrics',
				count: openaiErr,
			})
		}
		if (wppErr >= 10) {
			logger.warn('alert_whatsapp_errors_high', {
				component: 'metrics',
				count: wppErr,
			})
		}
	}, intervalMs).unref()
}
