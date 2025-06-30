import path from 'node:path'
import { logger } from '@/core/logger'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { prisma } from '@/lib/prisma'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { clearDatabase } from 'ROOT/clear-database'
import { PrismaRepositoryFactory } from '../factory/prisma/prisma-repository-factory'
import { PrismaWhatsAppMessageServiceFactory } from '../factory/prisma/prisma-whats-app-message-service-factory'
import { app } from './app'
import { interactionMock } from './interaction-mock'
import { receiveMessage } from './routes/message/receive-message'
import { webhook } from './routes/whats-app-webhook/token'

console.clear()
logger.info('Starting server setup')

const projectRoot = findProjectRoot(__dirname)
const responseFilePath = path.join(projectRoot, 'response.json')

emptyJsonFile(responseFilePath)
logger.debug(`Response file initialized at ${responseFilePath}`)

async function main() {
    await prisma.$transaction(async tx => {
        logger.debug('Clearing database collections')
        await clearDatabase(tx, ['message', 'conversation'])
    })
    const repositoryFactory: RepositoryFactory = new PrismaRepositoryFactory()
    const useCaseFactory = new UseCaseFactory(repositoryFactory)
    const whatsAppMessageServiceFactory =
        new PrismaWhatsAppMessageServiceFactory(
            useCaseFactory,
            repositoryFactory
        )
    logger.debug('Creating WhatsApp message service')
    const whatsAppMessageService = whatsAppMessageServiceFactory.createService()

    app.register(receiveMessage, { whatsAppMessageService })
    app.register(webhook)

    logger.debug('Routes registered')
    const serverAddress = await app.listen({ port: 8000 })

    logger.info(`Server running on -> ${serverAddress}`)

    // await interactionMock()
}

main()
