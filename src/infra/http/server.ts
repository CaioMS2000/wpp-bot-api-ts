import path from 'node:path'
import { logger } from '@/core/logger'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { InMemoryWhatsAppMessageServiceFactory } from '../factory/in-memory/in-memory-whats-app-message-service-factory'
import { app } from './app'
import { interactionMock } from './interaction-mock'
import { receiveMessage } from './routes/message/receive-message'
import { seedInMemoryRepositories } from '../database/in-memory-seed'

const projectRoot = findProjectRoot(__dirname)
const responseFilePath = path.join(projectRoot, 'response.json')

emptyJsonFile(responseFilePath)

const whatsAppMessageService = InMemoryWhatsAppMessageServiceFactory.create()

app.register(receiveMessage, { whatsAppMessageService })

async function main() {
    const serverAddress = await app.listen({ port: 3000 })

    console.clear()
    logger.info(`Server running on -> ${serverAddress}`)

    await seedInMemoryRepositories(whatsAppMessageService)
    await interactionMock()
}

main()
