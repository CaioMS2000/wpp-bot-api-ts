import { DepartmentQueueService } from '../services/department-queue-service'
import { DepartmentServiceFactory } from './department-service-factory'
import { UserServiceFactory } from './user-service-factory'

export class DepartmentQueueServiceFactory {
	constructor(
		private departmentServiceFactory: DepartmentServiceFactory,
		private userServiceFactory: UserServiceFactory
	) {}

	getService(): DepartmentQueueService {
		return new DepartmentQueueService(
			this.departmentServiceFactory.getService(),
			this.userServiceFactory.getService()
		)
	}
}
