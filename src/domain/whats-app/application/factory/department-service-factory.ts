import { DepartmentService } from '../services/department-service'
import { RepositoryFactory } from './repository-factory'

export class DepartmentServiceFactory {
	constructor(private repositoryFactory: RepositoryFactory) {}

	getService() {
		return new DepartmentService(
			this.repositoryFactory.getDepartmentRepository(),
			this.repositoryFactory.getEmployeeRepository()
		)
	}
}
