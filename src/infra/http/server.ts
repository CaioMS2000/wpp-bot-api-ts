import { WhatsAppMessageServiceFactory } from '../factory/whats-app-message-service-factory'
import { app } from './app'
import { receiveMessage } from './routes/message/receive-message'

const whatsAppMessageService = WhatsAppMessageServiceFactory.create()

app.register(receiveMessage, { whatsAppMessageService })

app.listen({ port: 3000 }).then((...args) => {
    console.log(`Server running on -> ${args}`)
})
