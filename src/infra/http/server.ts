import { env } from '@/config/env'
import { AutoCloseJob } from '@/infra/jobs/AutoCloseJob'
import { FastifyListenOptions } from 'fastify'
import { app } from './app'
import { DependenciesContainer } from './dependencies-container'
import { receiveMessage } from './routes/whatsapp/message/receive-message'
import { router as authRouter } from './routes/api/auth/router'
import { router as tenantRouter } from './routes/api/tenant/router'
import { router as employeeRouter } from './routes/api/employee/router'
import { router as metricsRouter } from './routes/api/metrics/router'
import { router as departmentRouter } from './routes/api/department/router'
import { router as conversationRouter } from './routes/api/conversation/router'
import { router as faqRouter } from './routes/api/faq/router'
import { router as filesRouter } from './routes/api/files/router'
import { webhook } from './routes/whatsapp/message/verify-token'

const container = new DependenciesContainer()

app.decorateRequest('authService', {
	getter() {
		return container.authService
	},
})
app.get('/health', async () => ({ status: 'ok' }))

// main
app.register(webhook)
app.register(receiveMessage, {
	customerServiceManager: container.customerServiceManager,
	prisma: container.prisma,
	messageQueue: container.messageQueue,
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

const config: FastifyListenOptions = {
	port: env.PORT,
}

if (env.NODE_ENV === 'production') {
	config.host = '0.0.0.0'
}

app.listen({ ...config }).then(x => console.log(`Server running on -> ${x}`))

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
