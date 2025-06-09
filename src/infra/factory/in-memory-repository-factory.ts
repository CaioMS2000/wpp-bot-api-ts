import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { InMemoryClientRepository } from '../database/repositories/in-memory/client-repository'
import { InMemoryConversationRepository } from '../database/repositories/in-memory/conversation-repository'
import { InMemoryDepartmentRepository } from '../database/repositories/in-memory/department-repository'
import { InMemoryFAQRepository } from '../database/repositories/in-memory/faq-repository'
import { InMemoryMessageRepository } from '../database/repositories/in-memory/message-repository'

export class InMemoryRepositoryFactory {
    static createClientRepository(): ClientRepository {
        return new InMemoryClientRepository()
    }

    static createConversationRepository(): ConversationRepository {
        return new InMemoryConversationRepository()
    }

    static createDepartmentRepository(): DepartmentRepository {
        return new InMemoryDepartmentRepository()
    }

    static createFAQRepository(): FAQRepository {
        return new InMemoryFAQRepository()
    }

    static createMessageRepository(): MessageRepository {
        return new InMemoryMessageRepository()
    }
}
