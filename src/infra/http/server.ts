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
import { createCompany } from './routes/api/company/create-company'
import { getAllChats } from './routes/api/company/get-chats'
import { getCompanyInfo } from './routes/api/company/get-company-info'
import { getFAQs } from './routes/api/company/get-faqs'
import { getRecentChats } from './routes/api/company/get-recent-chats'
import { updateCompany } from './routes/api/company/update-company'
import { getAllDepartments } from './routes/api/department/get-all-departments'
import { getDepartment } from './routes/api/department/get-department'
import { getAllEmployees } from './routes/api/employee/get-all-employees'
import { getEmployee } from './routes/api/employee/get-employee'
import { whatsAppWebhook } from './routes/message/whats-app-webhook'
import { webhook } from './routes/whats-app-webhook/token'
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
		getCompanyInfoUseCase:
			container.webAPIUseCaseFactory.getGetCompanyInfoUseCase(),
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

	logger.debug('Routes registered')

	const serverAddress = await app.listen({ port: 8000 })

	logger.info(`Server running on -> ${serverAddress}`)
}

main()
