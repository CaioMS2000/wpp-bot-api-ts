import { UserService } from '../services/user-service'
import { CompanyServiceFactory } from './company-service-factory'

export class UserServiceFactory {
	constructor(private companyServiceFactory: CompanyServiceFactory) {}

	getService() {
		return new UserService(this.companyServiceFactory.getService())
	}
}
