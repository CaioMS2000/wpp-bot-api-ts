import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { InMemoryClientRepository } from '../../database/repositories/in-memory/client-repository'
import { InMemoryConversationRepository } from '../../database/repositories/in-memory/conversation-repository'
import { InMemoryDepartmentRepository } from '../../database/repositories/in-memory/department-repository'
import { InMemoryFAQRepository } from '../../database/repositories/in-memory/faq-repository'
import { InMemoryMessageRepository } from '../../database/repositories/in-memory/message-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { InMemoryEmployeeRepository } from '../../database/repositories/in-memory/employee-repository'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { InMemoryCompanyRepository } from '@/infra/database/repositories/in-memory/company-repository'

export class InMemoryRepositoryFactory {
    createClientRepository(): ClientRepository {
        return new InMemoryClientRepository()
    }

    createEmployeeRepository(): EmployeeRepository {
        return new InMemoryEmployeeRepository()
    }

    createConversationRepository(): ConversationRepository {
        return new InMemoryConversationRepository()
    }

    createDepartmentRepository(): DepartmentRepository {
        return new InMemoryDepartmentRepository()
    }

    createFAQRepository(): FAQRepository {
        return new InMemoryFAQRepository()
    }

    createMessageRepository(): MessageRepository {
        return new InMemoryMessageRepository()
    }

    createCompanyRepository(): CompanyRepository {
        return new InMemoryCompanyRepository()
    }
}
