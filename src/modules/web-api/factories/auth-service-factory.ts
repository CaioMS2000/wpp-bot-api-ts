import { CompanyServiceFactory } from '@/modules/whats-app/factory/company-service-factory'
import { AuthService } from '../services/auth-service'
import { ManagerServiceFactory } from './manager-service-factory'

export class AuthServiceFactory {
	constructor(
		private companyServiceFactory: CompanyServiceFactory,
		private managerServiceFactory: ManagerServiceFactory
	) {}

	getService() {
		return new AuthService(
			this.companyServiceFactory.getService(),
			this.managerServiceFactory.getService()
		)
	}
}
