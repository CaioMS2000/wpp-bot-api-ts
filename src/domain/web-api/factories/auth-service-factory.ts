import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { AuthService } from '../services/auth-service'

export class AuthServiceFactory {
	constructor(private repositoryFactory: RepositoryFactory) {}

	getService() {
		return new AuthService(
			this.repositoryFactory.getCompanyRepository(),
			this.repositoryFactory.getManagerRepository()
		)
	}
}
