import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { execute } from '@caioms/ts-utils/functions'
import { TransitionIntent } from '../factory/types'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ConversationState } from './conversation-state'

export type FAQItemsStateProps = {
    categoryName: string
}

export class FAQItemsState extends ConversationState<FAQItemsStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private listFAQCategorieItemsUseCase: ListFAQCategorieItemsUseCase,
        private categoryName: string
    ) {
        super(conversation, outputPort, { categoryName })
    }

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        throw new Error('Method not implemented.')
    }

    async getNextState(message = ''): Promise<Nullable<TransitionIntent>> {
        return { target: 'faq_categories' }
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
