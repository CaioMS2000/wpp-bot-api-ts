import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class DepartmentSelectionState extends ConversationState {
    constructor(
        conversation: Conversation,
        private departments: Department[]
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    getResponse(): string {
        return this.formatMenuOptions(
            this.departments.map((dept, index) => ({
                key: (index + 1).toString(),
                label: dept.name,
            }))
        )
    }
}
