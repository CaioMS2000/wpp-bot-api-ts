import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Message } from '@/domain/entities/message'
import { execute } from '@caioms/ts-utils/functions'
import { MenuOption } from '../../../@types'
import { ListActiveDepartmentsUseCase } from '../../use-cases/list-active-departments-use-case'
import { ConversationState } from '../conversation-state'
import { StateTypeMapper } from '../types'

export class DepartmentSelectionState extends ConversationState<null> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase
    ) {
        super(conversation, outputPort)
    }

    async handleMessage(message: Message): Promise<Nullable<StateTypeMapper>> {
        if (message.content === 'Menu principal') {
            return { stateName: 'InitialMenuState' }
        }

        const availableDepartments =
            await this.listActiveDepartmentsUseCase.execute(
                this.conversation.company
            )
        const correspondingDepartment = availableDepartments.find(
            dept => dept.name === message.content
        )

        if (correspondingDepartment) {
            return {
                stateName: 'DepartmentQueueState',
                params: { departmentId: correspondingDepartment.id },
            }
        }

        await this.sendSelectionMessage()

        return null
    }

    async onEnter() {
        await this.sendSelectionMessage()
    }

    private async loadDepartmentsMenu() {
        const availableDepartments =
            await this.listActiveDepartmentsUseCase.execute(
                this.conversation.company
            )
        const menuOptions: MenuOption[] = availableDepartments
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

        return menuOptions
    }

    private async sendSelectionMessage() {
        const menuOptions = await this.loadDepartmentsMenu()

        const listOutput: OutputMessage = {
            type: 'list',
            text: 'Departamentos',
            buttonText: 'Ver',
            sections: [
                {
                    title: 'Items',
                    rows: menuOptions.map(opt => ({
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
