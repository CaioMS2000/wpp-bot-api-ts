import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { APIService } from '../services/api-service'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'

export class ApiServiceFactory {
	constructor(
		private repositoryFactory: RepositoryFactory,
		private useCaseFactory: UseCaseFactory
	) {}

	getService() {
		return new APIService()
	}
}
