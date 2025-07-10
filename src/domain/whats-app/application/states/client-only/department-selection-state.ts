import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { execute } from '@caioms/ts-utils/functions'
import { MenuOption } from '../../../@types'
import { TransitionIntent } from '../../factory/types'
import { ConversationState } from '../conversation-state'
import { logger } from '@/core/logger'

type DepartmentSelectionStateProps = {
    departments: Department[]
}

export class DepartmentSelectionState extends ConversationState<DepartmentSelectionStateProps> {
    private menuOptions: MenuOption[]

    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        departments: Department[]
    ) {
        super(conversation, outputPort, { departments })

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

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        if (messageContent === 'Menu principal') {
            return { target: 'initial_menu' }
        }

        const correspondingDepartment = this.departments.find(
            dept => dept.name === messageContent
        )

        if (correspondingDepartment) {
            return { target: 'department_queue' }
        }

        await this.sendSelectionMessage()

        return null
    }

    async onEnter() {
        await this.sendSelectionMessage()
    }

    private async sendSelectionMessage() {
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
            this.outputPort.handle,
            this.conversation.user,
            listOutput
        )
    }
}
