import { WhatsAppOutputPort } from '@/infra/http/output/whats-app-output-port'
import { StateTransitionService } from '../services/state-transition-service'
import { RepositoryFactory } from './repository-factory'
import type { StateFactory } from './state-factory'
import { UseCaseFactory } from './use-case-factory'

export class StateTransitionServiceFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private useCaseFactory: UseCaseFactory,
        private stateFactory: StateFactory
    ) {}
    createService() {
        const departmentRepository =
            this.repositoryFactory.createDepartmentRepository()
        const listActiveDepartmentsUseCase =
            this.useCaseFactory.getListActiveDepartmentsUseCase()
        const insertClientIntoDepartmentQueue =
            this.useCaseFactory.getInsertClientIntoDepartmentQueue()
        const transferEmployeeToClientConversationUseCase =
            this.useCaseFactory.getTransferEmployeeToClientConversationUseCase()
        const getDepartmentUseCase =
            this.useCaseFactory.getGetDepartmentUseCase()
        return new StateTransitionService(
            this.stateFactory,
            departmentRepository,
            listActiveDepartmentsUseCase,
            insertClientIntoDepartmentQueue,
            transferEmployeeToClientConversationUseCase,
            getDepartmentUseCase
        )
    }
}
