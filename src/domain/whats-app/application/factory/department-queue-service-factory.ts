import { DepartmentQueueService } from '../services/department-queue-service'
import { RepositoryFactory } from './repository-factory'

export class DepartmentQueueServiceFactory {
    constructor(private repositoryFactory: RepositoryFactory) {}

    getService(): DepartmentQueueService {
        return new DepartmentQueueService(
            this.repositoryFactory.getDepartmentRepository(),
            this.repositoryFactory.getClientRepository()
        )
    }
}
