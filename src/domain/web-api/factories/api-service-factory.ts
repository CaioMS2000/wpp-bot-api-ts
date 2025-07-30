import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { APIService } from '../services/api-service'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { DepartmentServiceFactory } from '@/domain/whats-app/application/factory/department-service-factory'

export class ApiServiceFactory {
	constructor(
		private repositoryFactory: RepositoryFactory,
		private useCaseFactory: UseCaseFactory,
		private departmentServiceFactory: DepartmentServiceFactory
	) {}

	getService() {
		return new APIService(
			this.repositoryFactory.getDepartmentRepository(),
			this.repositoryFactory.getEmployeeRepository(),
			this.repositoryFactory.getConversationRepository(),
			this.repositoryFactory.getCompanyRepository(),
			this.repositoryFactory.getFAQRepository(),
			this.useCaseFactory.getGetManagerProfileUseCase(),
			this.useCaseFactory.getGetAllCompanyEmployeesUseCase(),
			this.useCaseFactory.getGetClientUseCase(),
			this.useCaseFactory.getGetEmployeeUseCase(),
			this.useCaseFactory.getGetCompanyUseCase(),
			this.departmentServiceFactory.getService()
		)
	}
}
