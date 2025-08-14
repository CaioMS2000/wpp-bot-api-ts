import { DepartmentService } from '../services/department-service'
import { UserServiceFactory } from './user-service-factory'

export class DepartmentServiceFactory {
	constructor(private userServiceFactory: UserServiceFactory) {}

	getService() {
		return new DepartmentService(this.userServiceFactory.getService())
	}
}
