import { ClientRepository } from '@/domain/repositories/client-repository'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { ManagerRepository } from '@/domain/repositories/manager-repository'

export abstract class RepositoryFactory {
	abstract getClientRepository(): ClientRepository
	abstract getEmployeeRepository(): EmployeeRepository
	abstract getConversationRepository(): ConversationRepository
	abstract getDepartmentRepository(): DepartmentRepository
	abstract getFAQRepository(): FAQRepository
	abstract getCompanyRepository(): CompanyRepository
	abstract getManagerRepository(): ManagerRepository
}
