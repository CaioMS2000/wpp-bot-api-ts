import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { ConversationState } from '../conversation-state'
import { StateTransition } from '../state-transition'

type DepartmentChatStateProps = {
    department: Department
}

export class DepartmentChatState extends ConversationState<DepartmentChatStateProps> {
    constructor(conversation: Conversation, department: Department) {
        super(conversation, { department })
    }

    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    get entryMessage() {
        return null
    }
}
