import { fileURLToPath } from 'node:url'
import { PrismaClient, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/logger'

export async function clearDatabase(
	prisma: PrismaClient | Prisma.TransactionClient,
	modelsList: string[] = []
) {
	let models: Nullable<string[]> = null
	// Ordem importa! Do mais dependente → ao mais independente
	const orderedModels = [
		'message',
		'conversation',
		'departmentQueue',
		'client',
		'employee',
		'department',
		'fAQItem',
		'fAQCategory',
		'businessHour',
		'company',
		'manager',
	]

	if (modelsList.length > 0) {
		logger.info('using modelsList')
		models = modelsList
	} else {
		logger.info('using orderedModels')
		models = orderedModels
	}

	logger.info(`Deleting models: ${models.join(', ')}`)

	for (const modelName of models) {
		const model = prisma[modelName as keyof typeof prisma] as any
		if (typeof model?.deleteMany === 'function') {
			logger.debug(`Deleting ${modelName}...`)
			await model.deleteMany({})
		}
	}
}

async function main() {
	await prisma.$transaction(async tx => {
		await clearDatabase(tx)
	})
}

// @ts-ignore
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)

if (isMainModule) {
	console.clear()
	logger.info('Script de limpeza de banco de dados')
	main()
		.then(() => {
			logger.info('Clear concluído com sucesso')
		})
		.catch(e => {
			logger.error(e)
			process.exit(1)
		})
		.finally(async () => {
			await prisma.$disconnect()
		})
}
