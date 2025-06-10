import { Department } from '@/domain/entities/department'
import { WhatsAppMessageServiceFactory } from '../factory/whats-app-message-service-factory'
import { app } from './app'
import { receiveMessage } from './routes/message/receive-message'

const whatsAppMessageService = WhatsAppMessageServiceFactory.create()

whatsAppMessageService.departmentRepository.save(
    Department.create({
        name: 'Departamento de TI',
        employee: [],
        queue: [],
    })
)
whatsAppMessageService.departmentRepository.save(
    Department.create({
        name: 'Departamento de Vendas',
        employee: [],
        queue: [],
    })
)
whatsAppMessageService.faqRepository.save(
    'suporte',
    'Como faço para resetar minha senha?',
    'Para resetar sua senha, acesse a página de login e clique em "Esqueci minha senha".'
)
whatsAppMessageService.faqRepository.save(
    'suporte',
    'O sistema está fora do ar, o que fazer?',
    'Primeiro verifique sua conexão com a internet. Se o problema persistir, entre em contato com o suporte técnico.'
)
whatsAppMessageService.faqRepository.save(
    'vendas',
    'Quais são as formas de pagamento aceitas?',
    'Aceitamos cartão de crédito, débito, PIX e boleto bancário.'
)
whatsAppMessageService.faqRepository.save(
    'vendas',
    'Qual o prazo de entrega dos produtos?',
    'O prazo de entrega varia de acordo com sua localização, geralmente entre 3 a 7 dias úteis.'
)

app.register(receiveMessage, { whatsAppMessageService })

async function sendMessage(message: string) {
    try {
        const response = await fetch('http://localhost:3000/message', {
            method: 'POST',
            body: JSON.stringify({
                clientPhone: '5562993765723',
                messageContent: message,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()

        console.log('\n\nrequest response:')
        console.log(data)

        return data
    } catch (error) {
        console.error(error)
    }
}
async function main() {
    const serverAddress = await app.listen({ port: 3000 })

    console.clear()
    console.log(`Server running on -> ${serverAddress}`)

    await sendMessage('oi')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('3')

    await new Promise(resolve => setTimeout(resolve, 1000 * 1))

    await sendMessage('suporte')

    await new Promise(resolve => setTimeout(resolve, 1000 * 5))

    await sendMessage('Menu principal')
}

main()
