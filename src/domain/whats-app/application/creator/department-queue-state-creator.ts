import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from '../states/conversation-state'
import { StateCreator } from './state-creator'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { Department } from '@/domain/entities/department'
import { isDepartment } from '@/utils/entity'

export class DepartmentQueueStateCreator implements StateCreator {
    create(conversation: Conversation, data?: unknown): ConversationState {
        this.validate(data)

        const department = data as Department

        return new DepartmentQueueState(conversation, department)
    }

    validate(data: unknown) {
        if (!isDepartment(data)) {
            throw new Error('Data must be a Department object')
        }
    }
}
