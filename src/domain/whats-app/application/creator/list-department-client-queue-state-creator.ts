import { Conversation } from '@/domain/entities/conversation'
import { isDepartment } from '@/utils/entity'
import { ConversationState } from '../states/conversation-state'
import { StateCreator } from './state-creator'
import { ListDepartmentQueueState } from '../states/employee-only/list-department-client-queue-state'
import { Department } from '@/domain/entities/department'

export class ListDepartmentQueueStateCreator implements StateCreator {
    validate(data?: unknown) {
        if (!isDepartment(data)) {
            throw new Error('Data must be a Department object')
        }
    }
    create(conversation: Conversation, data?: unknown): ConversationState {
        this.validate(data)

        return new ListDepartmentQueueState(conversation, data as Department)
    }
}
