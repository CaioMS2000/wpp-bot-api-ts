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
        console.log('\n\nmessageContent')
        console.log(messageContent)
        console.log('available departments')
        console.log(this.departments)

        const correspondingDepartment = this.departments.find(
            dept => dept.name === messageContent
        )

        console.log('correspondingDepartment')
        console.log(correspondingDepartment)

        if (correspondingDepartment) {
            return StateTransition.toDepartmentChat(messageContent)
        }

        return StateTransition.stayInCurrent()
    }

    getResponse(): string {
        return this.formatMenuOptions(
            this.departments
                .map((dept, index) => ({
                    key: (index + 1).toString(),
                    label: dept.name,
                }))
                .concat([{ key: 'menu', label: 'Menu principal' }])
        )
    }
}
