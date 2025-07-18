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
import type { StateFactory } from '@/domain/whats-app/application/factory/state-factory'
import { PrismaStateDataParser } from '@/infra/database/state-data-parser/prisma/prisma-state-data-parser'
import { ManagerRepository } from '@/domain/repositories/manager-repository'
import { PrismaManagerRepository } from '@/infra/database/repositories/prisma/manager-repository'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'

export class PrismaRepositoryFactory implements RepositoryFactory {
    private clientRepository!: PrismaClientRepository
    private employeeRepository!: PrismaEmployeeRepository
    private conversationRepository!: PrismaConversationRepository
    private departmentRepository!: PrismaDepartmentRepository
    private fAQRepository!: PrismaFAQRepository
    private messageRepository!: PrismaMessageRepository
    private companyRepository!: PrismaCompanyRepository
    private managerRepository!: PrismaManagerRepository
    private prismaStateDataParser: PrismaStateDataParser

    constructor(private stateFactory: StateFactory) {
        this.prismaStateDataParser = new PrismaStateDataParser(
            this.stateFactory
        )
        this.initializeRepositories()
        this.wireDependencies()
    }

    private initializeRepositories() {
        this.conversationRepository = new PrismaConversationRepository()
        this.clientRepository = new PrismaClientRepository()
        this.employeeRepository = new PrismaEmployeeRepository()
        this.departmentRepository = new PrismaDepartmentRepository()
        this.fAQRepository = new PrismaFAQRepository()
        this.messageRepository = new PrismaMessageRepository()
        this.companyRepository = new PrismaCompanyRepository()
        this.managerRepository = new PrismaManagerRepository()
    }
    private wireDependencies() {
        // company repository
        this.companyRepository.managerRepository = this.managerRepository

        // conversation repository
        this.conversationRepository.prismaStateDataParser =
            this.prismaStateDataParser
        this.conversationRepository.clientRepository = this.clientRepository
        this.conversationRepository.employeeRepository = this.employeeRepository
        this.conversationRepository.companyRepository = this.companyRepository

        // department repository
        this.departmentRepository.clientRepository = this.clientRepository
        this.departmentRepository.employeeRepository = this.employeeRepository

        // employee repository
        this.employeeRepository.companyRepository = this.companyRepository

        // manager repository
        this.managerRepository.companyRepository = this.companyRepository

        // message repository
        this.messageRepository.conversationRepository =
            this.conversationRepository
    }

    getClientRepository(): ClientRepository {
        return this.clientRepository
    }

    getEmployeeRepository(): EmployeeRepository {
        return this.employeeRepository
    }

    getConversationRepository(): ConversationRepository {
        return this.conversationRepository
    }

    getDepartmentRepository(): DepartmentRepository {
        return this.departmentRepository
    }

    getFAQRepository(): FAQRepository {
        return this.fAQRepository
    }

    getMessageRepository(): MessageRepository {
        return this.messageRepository
    }

    getCompanyRepository(): CompanyRepository {
        return this.companyRepository
    }

    getManagerRepository(): ManagerRepository {
        return this.managerRepository
    }
}
