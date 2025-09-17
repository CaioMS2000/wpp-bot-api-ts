import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
	await prisma.message.deleteMany({})
	await prisma.aIMessage.deleteMany({})
	await prisma.sessionContext.deleteMany({})
	await prisma.aIChatSession.deleteMany({})
	await prisma.conversation.deleteMany({})
	await prisma.departmentQueueEntry.deleteMany({})
	// await prisma.employee.deleteMany({})
	// await prisma.department.deleteMany({})
	// await prisma.faqEntry.deleteMany({})
	// await prisma.faqCategory.deleteMany({})
}

run()
	.then(() => {
		console.log('Banco limpo')
	})
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
