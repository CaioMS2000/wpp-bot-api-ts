import path from 'node:path'
import { logger } from '@/core/logger'
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

	// Configuração do servidor
	// app.decorateRequest('container', {
	// 	getter() {
	// 		return container
	// 	},
	// })
	app.decorateRequest('authService', {
		getter() {
			return container.authService
		},
	})

	// Registrar rotas
	app.register(webhook)
	app.register(whatsAppWebhook, {
		whatsAppMessageService: container.whatsAppMessageService,
	})

	// API
	app.register(authenticateWithPassword, { authService: container.authService })
	app.register(register, { authService: container.authService })
	app.register(logout)

	app.register(createCompany, {
		createCompanyUseCase:
			container.webAPIUseCaseFactory.getCreateCompanyUseCase(),
	})
	app.register(getAllChats, {
		getChatsUseCase: container.webAPIUseCaseFactory.getGetChatsUseCase(),
	})
	app.register(getCompanyInfo, {
		getCompanyUseCase: container.webAPIUseCaseFactory.getGetCompanyUseCase(),
	})
	app.register(getEmployee, {
		getEmployeeByPhoneUseCase:
			container.webAPIUseCaseFactory.getGetEmployeeByPhoneUseCase(),
	})
	app.register(getAllEmployees, {
		getAllCompanyEmployeesUseCase:
			container.webAPIUseCaseFactory.getGetAllCompanyEmployeesUseCase(),
	})
	app.register(getDepartment, {
		getDepartmentUseCase:
			container.webAPIUseCaseFactory.getGetDepartmentUseCase(),
	})
	app.register(getAllDepartments, {
		getCompanyDepartmentsUseCase:
			container.webAPIUseCaseFactory.getGetCompanyDepartmentsUseCase(),
	})
	app.register(getFAQs, {
		getFAQsUseCase: container.webAPIUseCaseFactory.getGetFAQsUseCase(),
	})
	app.register(updateCompany, {
		updateCompanyUseCase:
			container.webAPIUseCaseFactory.getUpdateCompanyUseCase(),
	})
	app.register(getRecentChats, {
		getRecentChatsUseCase:
			container.webAPIUseCaseFactory.getGetRecentChatsUseCase(),
	})
	app.register(getBaseMetrics, {
		getBaseMetricsUseCase:
			container.webAPIUseCaseFactory.getGetBaseMetricsUseCase(),
	})
	app.register(getDepartmentsMetrics, {
		getDepartmentsMetricsUseCase:
			container.webAPIUseCaseFactory.getGetDepartmentsMetricsUseCase(),
	})
	app.register(createDepartment, {
		createDepartmentUseCase:
			container.webAPIUseCaseFactory.getCreateDepartmentUseCase(),
	})
	app.register(createEmployee, {
		createEmployeeUseCase:
			container.webAPIUseCaseFactory.getCreateEmployeeUseCase(),
	})
	app.register(getWeekConversationsMetrics, {
		getWeekConversationsMetrics:
			container.webAPIUseCaseFactory.getGetWeekConversationsMetrics(),
	})
	app.register(updateDepartment, {
		updateDepartmentUseCase:
			container.webAPIUseCaseFactory.getUpdateDepartmentUseCase(),
	})
	app.register(createFAQ, {
		createFAQUseCase: container.webAPIUseCaseFactory.getCreateFAQUseCase(),
	})
	app.register(updateFAQItem, {
		updateFAQItemUseCase:
			container.webAPIUseCaseFactory.getUpdateFAQItemUseCase(),
	})
	app.register(updateFAQCategoryName, {
		updateFAQCategoryNameUseCase:
			container.webAPIUseCaseFactory.getUpdateFAQCategoryNameUseCase(),
	})
	app.register(deleteFAQItem, {
		deleteFAQItemUseCase:
			container.webAPIUseCaseFactory.getDeleteFAQItemUseCase(),
	})
	app.register(deleteFAQCategory, {
		deleteFAQCategoryUseCase:
			container.webAPIUseCaseFactory.getDeleteFAQCategoryUseCase(),
	})

	logger.debug('Routes registered')

	const serverAddress = await app.listen({ port: 8000 })

	logger.info(`Server running on -> ${serverAddress}`)
}

main()
