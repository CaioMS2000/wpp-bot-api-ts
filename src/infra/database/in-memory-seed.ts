import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { InMemoryWhatsAppMessageServiceFactory } from '../factory/in-memory/in-memory-whats-app-message-service-factory'
import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'

export async function seedInMemoryRepositories(
    whatsAppMessageService: WhatsAppMessageService
) {
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
}
