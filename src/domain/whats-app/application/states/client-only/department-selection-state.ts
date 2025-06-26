import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { MenuOption } from '../../../@types'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'
import { formatMenuOptions } from '@/utils/menu'

type DepartmentSelectionStateProps = {
    departments: Department[]
}

export class DepartmentSelectionState extends ConversationState<DepartmentSelectionStateProps> {
    private menuOptions: MenuOption[]

    constructor(
        conversation: Conversation,
        departments: Department[],
        config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super(conversation, { departments }, config)

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

    get departments() {
        return this.props.departments
    }

    handleMessage(messageContent: string): StateTransition {
        if (messageContent === 'Menu principal') {
            return StateTransition.toInitialMenu()
        }

        const correspondingDepartment = this.departments.find(
            dept => dept.name === messageContent
        )

        logger.print('correspondingDepartment', correspondingDepartment)

        if (correspondingDepartment) {
            // return StateTransition.toDepartmentChat(messageContent)
            return StateTransition.toDepartmentQueue(messageContent)
        }

        return StateTransition.stayInCurrent()
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        this.config.outputPort.handle(
            this.conversation.user,
            `${formatMenuOptions(this.menuOptions)}`
        )
    }
}
