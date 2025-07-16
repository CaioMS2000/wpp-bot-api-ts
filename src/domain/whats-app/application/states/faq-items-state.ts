import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { execute } from '@caioms/ts-utils/functions'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ConversationState } from './conversation-state'
import { StateTypeMapper } from './types'

export type FAQItemsStateProps = {
    categoryName: string
}

export class FAQItemsState extends ConversationState<FAQItemsStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private listFAQCategorieItemsUseCase: ListFAQCategorieItemsUseCase,
        categoryName: string
    ) {
        super(conversation, outputPort, { categoryName })
    }

    get categoryName() {
        return this.props.categoryName
    }

    async handleMessage(message: Message): Promise<Nullable<StateTypeMapper>> {
        throw new Error('Method not implemented.')
    }

    async getNextState(message = ''): Promise<Nullable<StateTypeMapper>> {
        return { stateName: 'FAQCategoriesState' }
    }

    async onEnter() {
        const items = await this.listFAQCategorieItemsUseCase.execute(
            this.conversation.company,
            this.categoryName
        )
        const textOutput: OutputMessage = {
            type: 'text',
            content: items.reduce((acc, item) => {
                return `${acc}*${item.question}*\n${item.answer}\n\n`
            }, `*FAQ - ${this.categoryName}*\n\n`),
        } as const

        await execute(
            this.outputPort.handle,
            this.conversation.user,
            textOutput
        )
    }
}
