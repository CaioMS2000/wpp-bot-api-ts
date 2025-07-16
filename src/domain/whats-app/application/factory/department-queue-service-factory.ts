import { DepartmentQueueService } from '../services/department-queue-service'
import { RepositoryFactory } from './repository-factory'

export class DepartmentQueueServiceFactory {
    constructor(private repositoryFactory: RepositoryFactory) {}

    createService(): DepartmentQueueService {
        return new DepartmentQueueService(
            this.repositoryFactory.createDepartmentRepository(),
            this.repositoryFactory.createClientRepository()
        )
    }
}
