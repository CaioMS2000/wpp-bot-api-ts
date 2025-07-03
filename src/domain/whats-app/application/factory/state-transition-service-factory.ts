import { WhatsAppOutputPort } from '@/infra/http/output/whats-app-output-port'
import { StateTransitionService } from '../services/state-transition-service'
import { RepositoryFactory } from './repository-factory'
import { UseCaseFactory } from './use-case-factory'
import { StateFactory } from './state-factory'

export class StateTransitionServiceFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private useCaseFactory: UseCaseFactory
    ) {}
    createService() {
        const listFAQCategoriesUseCase =
            this.useCaseFactory.getListFAQCategoriesUseCase()
        const listFAQCategorieItemsUseCase =
            this.useCaseFactory.getListFAQCategorieItemsUseCase()
        const stateFactory = new StateFactory(
            listFAQCategoriesUseCase,
            listFAQCategorieItemsUseCase
        )
        const outputPort = new WhatsAppOutputPort()
        const departmentRepository =
            this.repositoryFactory.createDepartmentRepository()
        const removeClientFromDepartmentQueue =
            this.useCaseFactory.getRemoveClientFromDepartmentQueue()
        const listActiveDepartmentsUseCase =
            this.useCaseFactory.getListActiveDepartmentsUseCase()
        const insertClientIntoDepartmentQueue =
            this.useCaseFactory.getInsertClientIntoDepartmentQueue()
        const transferEmployeeToClientConversationUseCase =
            this.useCaseFactory.getTransferEmployeeToClientConversationUseCase()
        return new StateTransitionService(
            stateFactory,
            outputPort,
            departmentRepository,
            removeClientFromDepartmentQueue,
            listFAQCategoriesUseCase,
            listActiveDepartmentsUseCase,
            insertClientIntoDepartmentQueue,
            transferEmployeeToClientConversationUseCase
        )
    }
}
