import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { MenuOption } from '../../../@types'
import { ConversationState } from '../conversation-state'
import { StateTransition } from '../state-transition'

export class DepartmentSelectionState extends ConversationState {
    private menuOptions: MenuOption[]

    constructor(
        conversation: Conversation,
        private departments: Department[]
    ) {
        super(conversation)

        this.menuOptions = departments
            .map((dept, index) => ({
                key: (index + 1).toString(),
                label: dept.name,
                forClient: true,
                forEmployee: false,
            }))
            .concat([
                {
                    key: 'menu',
                    label: 'Menu principal',
                    forClient: true,
                    forEmployee: true,
                },
            ])
    }

    handleMessage(messageContent: string): StateTransition {
        const correspondingDepartment = this.departments.find(
            dept => dept.name === messageContent
        )

        logger.print('correspondingDepartment')
        logger.print(correspondingDepartment)

        if (correspondingDepartment) {
            // return StateTransition.toDepartmentChat(messageContent)
            return StateTransition.toDepartmentQueue(messageContent)
        }

        return StateTransition.stayInCurrent()
    }

    get entryMessage() {
        return this.formatMenuOptions(this.menuOptions)
    }
}
