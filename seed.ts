import { prisma } from '@/lib/prisma'
import { seedCompanyAndManager } from './seed/company'
import { seedBusinessHours } from './seed/business-hours'
import { seedFAQs } from './seed/faqs'
import { seedDepartments } from './seed/departments'
import { seedEmployees } from './seed/employees'
import { seedClientsAndChats } from './seed/chats'
import { logger } from '@/logger'

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
