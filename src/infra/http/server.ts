import path from 'node:path'
import { logger } from '@/logger'
import { prisma } from '@/lib/prisma'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { clearDatabase } from 'ROOT/clear-database'
import { app } from './app'
import { DependenciesContainer } from './dependencies-container'
import { authenticateWithPassword } from './routes/api/auth/authenticate-with-password'
import { logout } from './routes/api/auth/logout'
import { register } from './routes/api/auth/register-manager'
import { getAllChats } from './routes/api/chat/get-chats'
import { getRecentChats } from './routes/api/chat/get-recent-chats'
import { createCompany } from './routes/api/company/create-company'
import { getCompanyInfo } from './routes/api/company/get-company-info'
import { updateCompany } from './routes/api/company/update-company'
import { createDepartment } from './routes/api/department/create-department'
import { getAllDepartments } from './routes/api/department/get-all-departments'
import { getDepartment } from './routes/api/department/get-department'
import { updateDepartment } from './routes/api/department/update-department'
import { createEmployee } from './routes/api/employee/create-employee'
import { getAllEmployees } from './routes/api/employee/get-all-employees'
import { getEmployee } from './routes/api/employee/get-employee'
import { createFAQ } from './routes/api/faq/create-faq'
import { getFAQs } from './routes/api/faq/get-faqs'
import { getBaseMetrics } from './routes/api/metricts/base-metrics'
import { getDepartmentsMetrics } from './routes/api/metricts/departments-metricts'
import { getWeekConversationsMetrics } from './routes/api/metricts/get-week-conversations-metrics'
import { whatsAppWebhook } from './routes/message/whats-app-webhook'
import { webhook } from './routes/whats-app-webhook/token'
import { updateFAQItem } from './routes/api/faq/update-faq-item'
import { updateFAQCategoryName } from './routes/api/faq/update-faq-category-name'
import { deleteFAQItem } from './routes/api/faq/delete-faq-item'
import { deleteFAQCategory } from './routes/api/faq/delete-faq-category'

import { router as authRouter } from './routes/api/auth/router'
import { router as chatRouter } from './routes/api/chat/router'
import { router as companyRouter } from './routes/api/company/router'
import { router as departmentRouter } from './routes/api/department/router'
import { router as employeeRouter } from './routes/api/employee/router'
import { router as faqRouter } from './routes/api/faq/router'
import { router as metrictsRouter } from './routes/api/metricts/router'
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
	const container = new DependenciesContainer()

	app.decorateRequest('authService', {
		getter() {
			return container.authService
		},
	})

	// WhatsApp
	// Registrar rotas
	app.register(webhook)
	app.register(whatsAppWebhook, {
		whatsAppMessageService: container.whatsAppMessageService,
	})

	// API
	// Registrar rotas
	app.register(authRouter, {
		authService: container.authService,
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

	const serverAddress = await app.listen({ port: 8000 })

	logger.info(`Server running on -> ${serverAddress}`)
}

main()
