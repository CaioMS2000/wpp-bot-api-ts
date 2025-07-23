import { ClientRepository } from '@/domain/repositories/client-repository'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { PrismaCompanyRepository } from '@/infra/database/repositories/prisma/company-repository'
import { PrismaClientRepository } from '../../database/repositories/prisma/client-repository'
import { PrismaConversationRepository } from '../../database/repositories/prisma/conversation-repository'
import { PrismaDepartmentRepository } from '../../database/repositories/prisma/department-repository'
import { PrismaEmployeeRepository } from '../../database/repositories/prisma/employee-repository'
import { PrismaFAQRepository } from '../../database/repositories/prisma/faq-repository'
import { PrismaStateDataParser } from '@/infra/database/state-data-parser/prisma/prisma-state-data-parser'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'

export class PrismaRepositoryFactory implements RepositoryFactory {
	private clientRepository!: PrismaClientRepository
	private employeeRepository!: PrismaEmployeeRepository
	private conversationRepository!: PrismaConversationRepository
	private departmentRepository!: PrismaDepartmentRepository
	private fAQRepository!: PrismaFAQRepository
	private companyRepository!: PrismaCompanyRepository
	private prismaStateDataParser!: PrismaStateDataParser

	constructor() {
		this.initializeRepositories()
		this.wireDependencies()
	}

	private initializeRepositories() {
		this.conversationRepository = new PrismaConversationRepository()
		this.clientRepository = new PrismaClientRepository()
		this.employeeRepository = new PrismaEmployeeRepository()
		this.departmentRepository = new PrismaDepartmentRepository()
		this.fAQRepository = new PrismaFAQRepository()
		this.companyRepository = new PrismaCompanyRepository()
	}

	private wireDependencies() {
		this.conversationRepository.prismaStateDataParser =
			this.prismaStateDataParser
		this.conversationRepository.clientRepository = this.clientRepository
		this.conversationRepository.employeeRepository = this.employeeRepository
		this.conversationRepository.companyRepository = this.companyRepository
	}

	setPrismaStateDataParser(prismaStateDataParser: PrismaStateDataParser) {
		this.prismaStateDataParser = prismaStateDataParser
		this.conversationRepository.prismaStateDataParser =
			this.prismaStateDataParser
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

	getCompanyRepository(): CompanyRepository {
		return this.companyRepository
	}
}
