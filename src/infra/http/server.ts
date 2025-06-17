import path from 'node:path'
import { logger } from '@/core/logger'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { InMemoryRepositoryFactory } from '../factory/in-memory/in-memory-repository-factory'
import { InMemoryWhatsAppMessageServiceFactory } from '../factory/in-memory/in-memory-whats-app-message-service-factory'
import { app } from './app'
import { interactionMock } from './interaction-mock'
import { receiveMessage } from './routes/message/receive-message'

const projectRoot = findProjectRoot(__dirname)
const responseFilePath = path.join(projectRoot, 'response.json')

emptyJsonFile(responseFilePath)

const repositoryFactory: RepositoryFactory = new InMemoryRepositoryFactory()
const useCaseFactory = new UseCaseFactory(repositoryFactory)
const inMemoryWhatsAppMessageServiceFactory =
    new InMemoryWhatsAppMessageServiceFactory(useCaseFactory, repositoryFactory)
const whatsAppMessageService =
    inMemoryWhatsAppMessageServiceFactory.createService()

app.register(receiveMessage, { whatsAppMessageService })

async function main() {
    const serverAddress = await app.listen({ port: 3000 })

    console.clear()
    logger.info(`Server running on -> ${serverAddress}`)

    await interactionMock()
}

main()
