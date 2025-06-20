import { ClientRepository } from '@/domain/repositories/client-repository'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { PrismaCompanyRepository } from '@/infra/database/repositories/prisma/company-repository'
import { PrismaClientRepository } from '../../database/repositories/prisma/client-repository'
import { PrismaConversationRepository } from '../../database/repositories/prisma/conversation-repository'
import { PrismaDepartmentRepository } from '../../database/repositories/prisma/department-repository'
import { PrismaEmployeeRepository } from '../../database/repositories/prisma/employee-repository'
import { PrismaFAQRepository } from '../../database/repositories/prisma/faq-repository'
import { PrismaMessageRepository } from '../../database/repositories/prisma/message-repository'

export class PrismaRepositoryFactory {
    createClientRepository(): ClientRepository {
        return new PrismaClientRepository()
    }

    createEmployeeRepository(): EmployeeRepository {
        return new PrismaEmployeeRepository()
    }

    createConversationRepository(): ConversationRepository {
        return new PrismaConversationRepository()
    }

    createDepartmentRepository(): DepartmentRepository {
        return new PrismaDepartmentRepository()
    }

    createFAQRepository(): FAQRepository {
        return new PrismaFAQRepository()
    }

    createMessageRepository(): MessageRepository {
        return new PrismaMessageRepository()
    }

    createCompanyRepository(): CompanyRepository {
        return new PrismaCompanyRepository()
    }
}
