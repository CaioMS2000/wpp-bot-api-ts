import path from 'node:path'
import { env } from '@/config/env'
import { logger } from '@/logger'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { FastifyListenOptions } from 'fastify'
import { app } from './app'
import { DependenciesContainer } from './dependencies-container'
import { router as authRouter } from './routes/api/auth/router'
import { router as chatRouter } from './routes/api/chat/router'
import { router as companyRouter } from './routes/api/company/router'
import { router as departmentRouter } from './routes/api/department/router'
import { router as employeeRouter } from './routes/api/employee/router'
import { router as faqRouter } from './routes/api/faq/router'
import { router as metrictsRouter } from './routes/api/metricts/router'
import { receiveMessage } from './routes/message/receive-message'
import { webhook } from './routes/whats-app-webhook/token'

// console.clear()
logger.info('Starting server setup')

const projectRoot = findProjectRoot(__dirname)
const responseFilePath = path.join(projectRoot, 'request-logs.json')

emptyJsonFile(responseFilePath)
logger.debug(`Response file initialized at ${responseFilePath}`)

async function softDBClear() {
	const { clearDatabase } = await import('[ROOT]/clear-database')
	const { prisma } = await import('@/lib/prisma')

	await prisma.$transaction(async tx => {
		logger.debug('Clearing database collections')
		await clearDatabase(tx, [
			'message',
			'conversation',
			'departmentQueue',
			'client',
		])
	})
}
async function main() {
	// await softDBClear()

	const container = new DependenciesContainer()

	app.decorateRequest('authService', {
		getter() {
			return container.authService
		},
	})

	// WhatsApp
	// Registrar rotas
	app.register(webhook)
	app.register(receiveMessage, {
		whatsAppMessageService: container.whatsAppMessageService,
	})

	// API
	// Registrar rotas
	app.register(authRouter, {
		authService: container.authService,
		managerService: container.managerService,
		companyService: container.companyService,
	})

	app.register(chatRouter, {
		getChatsUseCase: container.webAPIUseCaseFactory.getGetChatsUseCase(),
		getRecentChatsUseCase:
			container.webAPIUseCaseFactory.getGetRecentChatsUseCase(),
	})

	app.register(companyRouter, {
		createCompanyUseCase:
			container.webAPIUseCaseFactory.getCreateCompanyUseCase(),
		getCompanyUseCase: container.webAPIUseCaseFactory.getGetCompanyUseCase(),
		updateCompanyUseCase:
			container.webAPIUseCaseFactory.getUpdateCompanyUseCase(),
	})

	app.register(departmentRouter, {
		createDepartmentUseCase:
			container.webAPIUseCaseFactory.getCreateDepartmentUseCase(),
		getCompanyDepartmentsUseCase:
			container.webAPIUseCaseFactory.getGetCompanyDepartmentsUseCase(),
		getDepartmentUseCase:
			container.webAPIUseCaseFactory.getGetDepartmentUseCase(),
		updateDepartmentUseCase:
			container.webAPIUseCaseFactory.getUpdateDepartmentUseCase(),
		deleteDepartmentUseCase:
			container.webAPIUseCaseFactory.getDeleteDepartmentUseCase(),
	})

	app.register(employeeRouter, {
		createEmployeeUseCase:
			container.webAPIUseCaseFactory.getCreateEmployeeUseCase(),
		getAllCompanyEmployeesUseCase:
			container.webAPIUseCaseFactory.getGetAllCompanyEmployeesUseCase(),
		getEmployeeByPhoneUseCase:
			container.webAPIUseCaseFactory.getGetEmployeeByPhoneUseCase(),
		updateEmployeeUseCase:
			container.webAPIUseCaseFactory.getUpdateEmployeeUseCase(),
	})

	app.register(faqRouter, {
		createFAQUseCase: container.webAPIUseCaseFactory.getCreateFAQUseCase(),
		deleteFAQCategoryUseCase:
			container.webAPIUseCaseFactory.getDeleteFAQCategoryUseCase(),
		deleteFAQItemUseCase:
			container.webAPIUseCaseFactory.getDeleteFAQItemUseCase(),
		getFAQsUseCase: container.webAPIUseCaseFactory.getGetFAQsUseCase(),
		updateFAQCategoryNameUseCase:
			container.webAPIUseCaseFactory.getUpdateFAQCategoryNameUseCase(),
		updateFAQItemUseCase:
			container.webAPIUseCaseFactory.getUpdateFAQItemUseCase(),
	})

	app.register(metrictsRouter, {
		getBaseMetricsUseCase:
			container.webAPIUseCaseFactory.getGetBaseMetricsUseCase(),
		getDepartmentsMetricsUseCase:
			container.webAPIUseCaseFactory.getGetDepartmentsMetricsUseCase(),
		getWeekConversationsMetrics:
			container.webAPIUseCaseFactory.getGetWeekConversationsMetrics(),
	})

	logger.debug('Routes registered')

	const config: FastifyListenOptions = {
		port: env.PORT,
	}

	if (env.NODE_ENV === 'production') {
		config.host = '0.0.0.0'
	}

	const serverAddress = await app.listen({ ...config })

	logger.info(`Server running on -> ${serverAddress}`)
}

main()
