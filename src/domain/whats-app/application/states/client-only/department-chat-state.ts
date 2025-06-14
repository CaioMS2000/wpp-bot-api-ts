import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { ConversationState } from '../conversation-state'
import { StateTransition } from '../state-transition'

export class DepartmentChatState extends ConversationState {
    constructor(
        conversation: Conversation,
        private department: Department
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    get entryMessage() {
        return null
    }
}
