import { prisma } from '@/lib/prisma'
import { logger } from '@/logger'
import { seedBusinessHours } from './seed/business-hours'
import { seedClientsAndChats } from './seed/chats'
import { seedCompanyAndManager } from './seed/company'
import { seedDepartments } from './seed/departments'
import { seedEmployees } from './seed/employees'
import { seedFAQs } from './seed/faqs'

async function main() {
	console.clear()
	await prisma.$transaction(async tx => {
		await seedCompanyAndManager(tx)
		await seedBusinessHours(tx)
		await seedDepartments(tx)
		await seedEmployees(tx)
		await seedFAQs(tx)
		await seedClientsAndChats(tx)
	})
}

main()
	.then(() => {
		logger.info('🌱 Seed concluído com sucesso')
	})
	.catch(e => {
		logger.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
