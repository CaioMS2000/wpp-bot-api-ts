import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { isDepartmentArray } from '@/utils/entity'
import { DepartmentSelectionState } from '../states/client-only/department-selection-state'
import { ConversationState } from '../states/conversation-state'
import { StateCreator } from './state-creator'

export class DepartmentSelectionStateCreator implements StateCreator {
    validate(data?: unknown) {
        if (!isDepartmentArray(data)) {
            throw new Error('Data must be an array of Department objects')
        }
    }
    create(conversation: Conversation, data?: unknown): ConversationState {
        this.validate(data)
        return new DepartmentSelectionState(conversation, data as Department[])
    }
}
