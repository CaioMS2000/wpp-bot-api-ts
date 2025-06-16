import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { RepositoryFactory } from './repository-factory'

export class UseCaseFactory {
    constructor(private repositoryFactory: RepositoryFactory) {}

    getListActiveDepartmentsUseCase(): ListActiveDepartmentsUseCase {
        return new ListActiveDepartmentsUseCase(
            this.repositoryFactory.createDepartmentRepository()
        )
    }
}
