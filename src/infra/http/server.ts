import { Department } from '@/domain/entities/department'
import { WhatsAppMessageServiceFactory } from '../factory/whats-app-message-service-factory'
import { app } from './app'
import { receiveMessage } from './routes/message/receive-message'

const whatsAppMessageService = WhatsAppMessageServiceFactory.create()

whatsAppMessageService.departmentRepo.save(
    Department.create({
        name: 'Departamento de TI',
        employee: [],
        queue: [],
    })
)
whatsAppMessageService.departmentRepo.save(
    Department.create({
        name: 'Departamento de Vendas',
        employee: [],
        queue: [],
    })
)
whatsAppMessageService.faqRepo.save(
    'suporte',
    'Como faço para resetar minha senha?',
    'Para resetar sua senha, acesse a página de login e clique em "Esqueci minha senha".'
)
whatsAppMessageService.faqRepo.save(
    'suporte',
    'O sistema está fora do ar, o que fazer?',
    'Primeiro verifique sua conexão com a internet. Se o problema persistir, entre em contato com o suporte técnico.'
)
whatsAppMessageService.faqRepo.save(
    'vendas',
    'Quais são as formas de pagamento aceitas?',
    'Aceitamos cartão de crédito, débito, PIX e boleto bancário.'
)
whatsAppMessageService.faqRepo.save(
    'vendas',
    'Qual o prazo de entrega dos produtos?',
    'O prazo de entrega varia de acordo com sua localização, geralmente entre 3 a 7 dias úteis.'
)

app.register(receiveMessage, { whatsAppMessageService })

app.listen({ port: 3000 }).then((...args) => {
    console.log(`Server running on -> ${args}`)
})
