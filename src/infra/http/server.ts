import path from 'node:path'
import { logger } from '@/core/logger'
import { ProcessClientMessageServiceFactory } from '@/domain/whats-app/application/factory/process-client-message-service-factory'
import { ProcessEmployeeMessageServiceFactory } from '@/domain/whats-app/application/factory/process-employee-message-service-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { prisma } from '@/lib/prisma'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { WhatsAppMessageServiceFactory } from '../../domain/whats-app/application/factory/whats-app-message-service-factory'
import { PrismaRepositoryFactory } from '../factory/prisma/prisma-repository-factory'
import { app } from './app'
import { whatsAppWebhook } from './routes/message/whats-app-webhook'
import { webhook } from './routes/whats-app-webhook/token'
import { StateFactory } from '@/domain/whats-app/application/factory/state-factory'
import { WhatsAppOutputPort } from './output/whats-app-output-port'
import { AIServiceFactory } from '@/domain/whats-app/application/factory/ai-service-factory'
import { DepartmentQueueServiceFactory } from '@/domain/whats-app/application/factory/department-queue-service-factory'
import { clearDatabase } from 'ROOT/clear-database'
import { StateServiceFactory } from '@/domain/whats-app/application/factory/state-service-factory'
import { PrismaStateDataParser } from '../database/state-data-parser/prisma/prisma-state-data-parser'
import { createCompany } from './routes/api/company/create-company'
import { authenticateWithPassword } from './routes/api/auth/authenticate-with-password'
import { AuthService } from '@/domain/web-api/services/auth-service'
import { AuthServiceFactory } from '@/domain/web-api/factories/auth-service-factory'
import { register } from './routes/api/auth/register-manager'
import { ApiServiceFactory } from '@/domain/web-api/factories/api-service-factory'
import { logout } from './routes/api/auth/logout'
// console.clear()
logger.info('Starting server setup')

const projectRoot = findProjectRoot(__dirname)
const responseFilePath = path.join(projectRoot, 'request-logs.json')

emptyJsonFile(responseFilePath)
logger.debug(`Response file initialized at ${responseFilePath}`)

async function softDBClear() {
	await prisma.$transaction(async tx => {
		logger.debug('Clearing database collections')
		await clearDatabase(tx, ['message', 'conversation', 'departmentQueue'])
	})
}
async function main() {
	// await softDBClear()
	const outputPort = new WhatsAppOutputPort()
	const aiServiceFactory = new AIServiceFactory()
	const stateFactory = new StateFactory(outputPort, aiServiceFactory)
	const repositoryFactory = new PrismaRepositoryFactory()
	const departmentQueueServiceFactory = new DepartmentQueueServiceFactory(
		repositoryFactory
	)
	const useCaseFactory = new UseCaseFactory(
		repositoryFactory,
		stateFactory,
		departmentQueueServiceFactory
	)
	const prismaStateDataParser = new PrismaStateDataParser(
		stateFactory,
		repositoryFactory,
		useCaseFactory
	)
	const stateServiceFactory = new StateServiceFactory(
		repositoryFactory,
		useCaseFactory,
		stateFactory
	)
	const authServiceFactory = new AuthServiceFactory(repositoryFactory)
	const apiServiceFactory = new ApiServiceFactory(
		repositoryFactory,
		useCaseFactory
	)

	repositoryFactory.setPrismaStateDataParser(prismaStateDataParser)
	stateFactory.setUseCaseFactory(useCaseFactory)
	aiServiceFactory.setRepositoryFactory(repositoryFactory)
	aiServiceFactory.setUseCaseFactory(useCaseFactory)

	const processClientMessageServiceFactory =
		new ProcessClientMessageServiceFactory(
			repositoryFactory,
			useCaseFactory,
			stateServiceFactory
		)
	const processEmployeeMessageServiceFactory =
		new ProcessEmployeeMessageServiceFactory(
			repositoryFactory,
			useCaseFactory,
			stateServiceFactory
		)
	const whatsAppMessageServiceFactory = new WhatsAppMessageServiceFactory(
		repositoryFactory,
		useCaseFactory,
		processClientMessageServiceFactory,
		processEmployeeMessageServiceFactory
	)

	logger.debug('Creating services')

	const whatsAppMessageService = whatsAppMessageServiceFactory.getService()
	const authService = authServiceFactory.getService()
	const apiService = apiServiceFactory.getService()

	// WhatsApp
	app.register(webhook)
	app.register(whatsAppWebhook, { whatsAppMessageService })

	// API
	app.register(createCompany)
	app.register(authenticateWithPassword, { authService })
	app.register(register, { authService })
	app.register(logout)

	logger.debug('Routes registered')

	const serverAddress = await app.listen({ port: 8000 })

	logger.info(`Server running on -> ${serverAddress}`)
}

main()
