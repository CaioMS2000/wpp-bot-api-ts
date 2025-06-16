import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'

export abstract class RepositoryFactory {
    abstract createClientRepository(): ClientRepository
    abstract createEmployeeRepository(): EmployeeRepository
    abstract createConversationRepository(): ConversationRepository
    abstract createDepartmentRepository(): DepartmentRepository
    abstract createFAQRepository(): FAQRepository
    abstract createMessageRepository(): MessageRepository
}
