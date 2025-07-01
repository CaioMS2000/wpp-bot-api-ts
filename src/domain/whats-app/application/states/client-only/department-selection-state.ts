import { logger } from '@/core/logger'
import { OutputMessage } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { formatMenuOptions } from '@/utils/menu'
import { execute } from '@caioms/ts-utils/functions'
import { MenuOption } from '../../../@types'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'

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

    async handleMessage(messageContent: string): Promise<StateTransition> {
        if (messageContent === 'Menu principal') {
            return StateTransition.toInitialMenu()
        }

        const correspondingDepartment = this.departments.find(
            dept => dept.name === messageContent
        )

        if (correspondingDepartment) {
            // return StateTransition.toDepartmentChat(messageContent)
            return StateTransition.toDepartmentQueue(messageContent)
        }

        return StateTransition.stayInCurrent()
    }

    async onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        const listOutput: OutputMessage = {
            type: 'list',
            text: 'Departamentos',
            buttonText: 'Ver',
            sections: [
                {
                    title: 'Items',
                    rows: this.menuOptions.map(opt => ({
                        id: opt.key,
                        title: opt.label,
                    })),
                },
            ],
        } as const

        await execute(
            this.config.outputPort.handle,
            this.conversation.user,
            listOutput
        )
    }
}
