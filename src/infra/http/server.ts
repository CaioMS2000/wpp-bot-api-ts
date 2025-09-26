import { __otel_loaded as _otel } from '@/infra/observability/otel'
void _otel
import { env } from '@/config/env'
import { AutoCloseJob } from '@/infra/jobs/AutoCloseJob'
import { FastifyListenOptions } from 'fastify'
import { app } from './app'
import { DependenciesContainer } from './dependencies-container'
import fastifyCors from '@fastify/cors'
import { router as platformConfigRouter } from './routes/admin/router'
import { router as authRouter } from './routes/api/auth/router'
import { router as conversationRouter } from './routes/api/conversation/router'
import { router as departmentRouter } from './routes/api/department/router'
import { router as employeeRouter } from './routes/api/employee/router'
import { router as faqRouter } from './routes/api/faq/router'
import { router as filesRouter } from './routes/api/files/router'
import { router as metricsRouter } from './routes/api/metrics/router'
import { router as tenantRouter } from './routes/api/tenant/router'
import { router as auditRouter } from './routes/admin/audit/router'
import { receiveMessage } from './routes/whatsapp/message/receive-message'
import { webhook } from './routes/whatsapp/verify-token'
import { logger, configureLogger } from '@/infra/logging/logger'
import { startMetricsReporter } from '../logging/metrics'
import { ConversationArchiveJob } from '@/infra/jobs/ConversationArchiveJob'
import { ConversationPurgeJob } from '@/infra/jobs/ConversationPurgeJob'

const container = new DependenciesContainer()
// Configure logger to use GlobalSettings for max file size (MB)
configureLogger({
	getMaxSizeMB: () =>
		container.globalConfigService.getNumber('LOG_MAX_SIZE_MB', 5),
})

app.decorateRequest('authService', {
	getter() {
		return container.authService
	},
})
app.get('/health', async () => ({ status: 'ok' }))

let allowedOriginsCache: string[] = []
let lastLoggedOrigins = ''
function normalizeOrigins(raw: unknown): string[] {
	if (Array.isArray(raw)) return raw.map(v => String(v).trim()).filter(Boolean)
	if (typeof raw === 'string')
		return raw
			.split(/[;,]/)
			.map(s => s.trim())
			.filter(Boolean)
	return []
}
async function refreshCors() {
	try {
		const raw = await container.globalConfigService.get<unknown>('CORS_ORIGINS')
		allowedOriginsCache = normalizeOrigins(raw)
		const serialized = JSON.stringify(allowedOriginsCache)
		if (serialized !== lastLoggedOrigins) {
			lastLoggedOrigins = serialized
			// Debug: print allowed origins directly to console for CORS troubleshooting
			// This complements the structured logger entry below
			console.log('[CORS] Allowed origins updated:', allowedOriginsCache)
			try {
				logger.info('cors_origins_updated', {
					component: 'http',
					allowedOrigins: allowedOriginsCache,
				})
			} catch {}
		}
	} catch {}
}
refreshCors().catch(() => {})
setInterval(() => refreshCors().catch(() => {}), 30_000).unref()

app.register(fastifyCors, {
	origin(origin, cb) {
		// Allow non-browser requests (no Origin)
		if (!origin) return cb(null, true)
		// Wildcard support
		if (allowedOriginsCache.includes('*')) return cb(null, true)
		const ok = allowedOriginsCache.includes(origin)
		cb(null, ok)
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})

// main
app.register(webhook)
app.register(receiveMessage, {
	customerServiceManager: container.customerServiceManager,
	prisma: container.prisma,
	messageQueue: container.messageQueue,
	globalConfig: container.globalConfigService,
})

// web API
app.register(authRouter, {
	authService: container.authService,
	userRepository: container.usersRepository,
	tenantRepository: container.prismaTenantRepository,
})
app.register(tenantRouter, {
	tenantRepository: container.prismaTenantRepository,
	userRepository: container.usersRepository,
})
app.register(metricsRouter, { prisma: container.prisma })
app.register(auditRouter, { prisma: container.prisma })
app.register(employeeRouter, {
	employeeRepository: container.employeeRepository,
})
app.register(departmentRouter, {
	departmentRepository: container.departmentRepository,
	employeeRepository: container.employeeRepository,
})
app.register(conversationRouter, { prisma: container.prisma })
app.register(faqRouter, { faqRepository: container.faqRepository })
app.register(filesRouter, {
	fileService: container.fileService,
	openaiRegistry: container.openaiRegistry,
	prisma: container.prisma,
})
app.register(platformConfigRouter, {
	globalConfigRepository: container.globalConfigRepository,
	globalConfig: container.globalConfigService,
})

const config: FastifyListenOptions = {
	port: env.PORT,
}

if (env.NODE_ENV === 'production') {
	config.host = '0.0.0.0'
}

app
	.listen({ ...config })
	.then(x => logger.info('server_listening', { component: 'http', address: x }))

// Start auto-close job (simple interval). In production, consider a dedicated worker.
const autoCloser = new AutoCloseJob(
	container.prisma,
	container.conversationFinalSummaryService
)
setInterval(
	() => {
		autoCloser.runWithLock().catch(() => {})
	},
	5 * 60 * 1000
).unref()

// Start metrics reporter (flush counters periodically)
startMetricsReporter()

// Periodic archive job (DB -> S3) for closed conversations
const archiver = new ConversationArchiveJob(
	container.prisma,
	container.globalConfigService
)
setInterval(() => archiver.runOnce().catch(() => {}), 10 * 60 * 1000).unref()

// Daily purge job (remove messages after grace period; keep headers with s3Uri)
const purger = new ConversationPurgeJob(container.prisma)
setInterval(() => purger.runOnce().catch(() => {}), 24 * 60 * 60 * 1000).unref()
