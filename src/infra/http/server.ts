import path from 'node:path'
import { logger } from '@/core/logger'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { prisma } from '@/lib/prisma'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { clearDatabase } from 'ROOT/clear-database'
import { PrismaRepositoryFactory } from '../factory/prisma/prisma-repository-factory'
import { WhatsAppMessageServiceFactory } from '../../domain/whats-app/application/factory/whats-app-message-service-factory'
import { app } from './app'
import { interactionMock } from './interaction-mock'
import { receiveMessage } from './routes/message/receive-message'
import { whatsAppWebhook } from './routes/message/whats-app-webhook'
import { webhook } from './routes/whats-app-webhook/token'
import { ProcessClientMessageServiceFactory } from '@/domain/whats-app/application/factory/process-client-message-service-factory'
import { ProcessEmployeeMessageServiceFactory } from '@/domain/whats-app/application/factory/process-employee-message-service-factory'
import { StateTransitionServiceFactory } from '@/domain/whats-app/application/factory/state-transition-service-factory'

console.clear()
logger.info('Starting server setup')

const projectRoot = findProjectRoot(__dirname)
const responseFilePath = path.join(projectRoot, 'request-logs.json')

emptyJsonFile(responseFilePath)
logger.debug(`Response file initialized at ${responseFilePath}`)

async function softDBClear() {
    await prisma.$transaction(async tx => {
        logger.debug('Clearing database collections')
        await clearDatabase(tx, ['message', 'conversation'])
    })
}
async function main() {
    // await softDBClear()
    const repositoryFactory: RepositoryFactory = new PrismaRepositoryFactory()
    const useCaseFactory = new UseCaseFactory(repositoryFactory)
    const stateTransitionServiceFactory = new StateTransitionServiceFactory(
        repositoryFactory,
        useCaseFactory
    )
    const processClientMessageServiceFactory =
        new ProcessClientMessageServiceFactory(
            repositoryFactory,
            useCaseFactory,
            stateTransitionServiceFactory
        )
    const processEmployeeMessageServiceFactory =
        new ProcessEmployeeMessageServiceFactory(
            repositoryFactory,
            useCaseFactory,
            stateTransitionServiceFactory
        )
    const whatsAppMessageServiceFactory = new WhatsAppMessageServiceFactory(
        repositoryFactory,
        useCaseFactory,
        processClientMessageServiceFactory,
        processEmployeeMessageServiceFactory
    )
    logger.debug('Creating WhatsApp message service')
    const whatsAppMessageService = whatsAppMessageServiceFactory.createService()

    app.register(webhook)
    // app.register(receiveMessage, { whatsAppMessageService })
    app.register(whatsAppWebhook, { whatsAppMessageService })

    logger.debug('Routes registered')
    const serverAddress = await app.listen({ port: 8000 })

    logger.info(`Server running on -> ${serverAddress}`)

    // await interactionMock()
}

main()
