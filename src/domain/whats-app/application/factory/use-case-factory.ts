import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByClientPhoneUseCase } from '../use-cases/find-conversation-by-client-phone-use-case'
import { FindConversationByEmployeePhoneUseCase } from '../use-cases/find-conversation-by-employee-phone-use-case'
import { FindEmployeeByPhoneUseCase } from '../use-cases/find-employee-by-phone-use-case'
import { FindOrCreateClientUseCase } from '../use-cases/find-or-create-client-use-case'
import { GetDepartmentUseCase } from '../use-cases/get-department-use-case'
import { InsertClientIntoDepartmentQueue } from '../use-cases/insert-client-into-department-queue'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { RemoveClientFromDepartmentQueue } from '../use-cases/remove-client-from-department-queue'
import { ResolveSenderContextUseCase } from '../use-cases/resolve-sender-context-use-case'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'
import { RepositoryFactory } from './repository-factory'
import type { StateFactory } from './state-factory'

export class UseCaseFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private stateFactory: StateFactory
    ) {}

    getListActiveDepartmentsUseCase(): ListActiveDepartmentsUseCase {
        return new ListActiveDepartmentsUseCase(
            this.repositoryFactory.createDepartmentRepository()
        )
    }

    getListFAQCategoriesUseCase(): ListFAQCategoriesUseCase {
        return new ListFAQCategoriesUseCase(
            this.repositoryFactory.createFAQRepository()
        )
    }

    getListFAQCategorieItemsUseCase(): ListFAQCategorieItemsUseCase {
        return new ListFAQCategorieItemsUseCase(
            this.repositoryFactory.createFAQRepository()
        )
    }

    getFindOrCreateClientUseCase(): FindOrCreateClientUseCase {
        return new FindOrCreateClientUseCase(
            this.repositoryFactory.createClientRepository()
        )
    }

    getFindEmployeeByPhoneUseCase(): FindEmployeeByPhoneUseCase {
        return new FindEmployeeByPhoneUseCase(
            this.repositoryFactory.createEmployeeRepository()
        )
    }

    getFindConversationByEmployeePhoneUseCase(): FindConversationByEmployeePhoneUseCase {
        return new FindConversationByEmployeePhoneUseCase(
            this.repositoryFactory.createConversationRepository()
        )
    }

    getCreateConversationUseCase(): CreateConversationUseCase {
        return new CreateConversationUseCase(
            this.repositoryFactory.createConversationRepository(),
            this.stateFactory
        )
    }

    getResolveSenderContextUseCase(): ResolveSenderContextUseCase {
        return new ResolveSenderContextUseCase(
            this.repositoryFactory.createCompanyRepository(),
            this.getFindEmployeeByPhoneUseCase(),
            this.getFindOrCreateClientUseCase()
        )
    }

    getTransferEmployeeToClientConversationUseCase(): TransferEmployeeToClientConversationUseCase {
        return new TransferEmployeeToClientConversationUseCase(
            this.repositoryFactory.createConversationRepository(),
            this.repositoryFactory.createDepartmentRepository(),
            this.stateFactory
        )
    }

    getFindConversationByClientPhoneUseCase(): FindConversationByClientPhoneUseCase {
        return new FindConversationByClientPhoneUseCase(
            this.repositoryFactory.createConversationRepository()
        )
    }

    getInsertClientIntoDepartmentQueue(): InsertClientIntoDepartmentQueue {
        return new InsertClientIntoDepartmentQueue(
            this.repositoryFactory.createDepartmentRepository()
        )
    }

    getRemoveClientFromDepartmentQueue(): RemoveClientFromDepartmentQueue {
        return new RemoveClientFromDepartmentQueue(
            this.repositoryFactory.createDepartmentRepository()
        )
    }

    getGetDepartmentUseCase(): GetDepartmentUseCase {
        return new GetDepartmentUseCase(
            this.repositoryFactory.createDepartmentRepository()
        )
    }
}
