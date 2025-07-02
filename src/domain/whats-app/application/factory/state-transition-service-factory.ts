import { StateTransitionService } from '../services/state-transition-service'
import { RepositoryFactory } from './repository-factory'
import { UseCaseFactory } from './use-case-factory'

export class StateTransitionServiceFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private useCaseFactory: UseCaseFactory
    ) {}
    createService() {
        const departmentRepository =
            this.repositoryFactory.createDepartmentRepository()
        const removeClientFromDepartmentQueue =
            this.useCaseFactory.getRemoveClientFromDepartmentQueue()
        const listFAQCategoriesUseCase =
            this.useCaseFactory.getListFAQCategoriesUseCase()
        const listFAQCategorieItemsUseCase =
            this.useCaseFactory.getListFAQCategorieItemsUseCase()
        const listActiveDepartmentsUseCase =
            this.useCaseFactory.getListActiveDepartmentsUseCase()
        const insertClientIntoDepartmentQueue =
            this.useCaseFactory.getInsertClientIntoDepartmentQueue()
        const transferEmployeeToClientConversationUseCase =
            this.useCaseFactory.getTransferEmployeeToClientConversationUseCase()
        return new StateTransitionService(
            departmentRepository,
            removeClientFromDepartmentQueue,
            listFAQCategoriesUseCase,
            listFAQCategorieItemsUseCase,
            listActiveDepartmentsUseCase,
            insertClientIntoDepartmentQueue,
            transferEmployeeToClientConversationUseCase
        )
    }
}
