import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { isDepartment } from '@/utils/entity'
import { DepartmentChatState } from '../states/client-only/department-chat-state'
import { ConversationState } from '../states/conversation-state'
import { StateCreator } from './state-creator'

export class DepartmentChatStateCreator implements StateCreator {
    validate(data?: unknown) {
        if (!isDepartment(data)) {
            throw new Error('Data must be a Department object')
        }
    }
    create(conversation: Conversation, data?: unknown): ConversationState {
        this.validate(data)

        return new DepartmentChatState(conversation, data as Department)
    }
}
