import path from 'node:path'
import { Department } from '@/domain/entities/department'
import { WhatsAppMessageServiceFactory } from '../factory/whats-app-message-service-factory'
import { app } from './app'
import { receiveMessage } from './routes/message/receive-message'
import { interactionMock } from './interaction-mock'
import { emptyJsonFile, findProjectRoot } from '@/utils/files'
import { Employee } from '@/domain/entities/employee'
import { logger } from '@/core/logger'

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
whatsAppMessageService.employeeRepository.save(
    Employee.create({
        department: 'Departamento de TI',
        event_history: [],
        phone: '5562993765721',
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

const projectRoot = findProjectRoot(__dirname)
const responseFilePath = path.join(projectRoot, 'response.json')
emptyJsonFile(responseFilePath)

async function main() {
    const serverAddress = await app.listen({ port: 3000 })

    console.clear()
    // console.log(`Server running on -> ${serverAddress}`)
    logger.info(`Server running on -> ${serverAddress}`)

    await interactionMock()
}

main()
