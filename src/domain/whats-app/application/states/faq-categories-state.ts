import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { FAQCategory } from '@/domain/entities/faq'
import { MenuOption } from '../../@types'
import { TransitionIntent } from '../factory/types'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { ConversationState } from './conversation-state'
import { logger } from '@/core/logger'

export class FAQCategoriesState extends ConversationState<null> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase
    ) {
        super(conversation, outputPort)
    }

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        logger.debug('[FAQCategoriesState.handleMessage]\n', {
            messageContent,
        })
        if (messageContent === 'Menu principal') {
            return { target: 'initial_menu' }
        }

        const categories = await this.listFAQCategoriesUseCase.execute(
            this.conversation.company
        )
        const correspondingCategory = categories.find(
            category => category.name === messageContent
        )

        logger.debug('[FAQCategoriesState.handleMessage]\n', {
            categories: categories.map(
                cat => `${cat.name} with ${cat.items.length} items`
            ),
            messageContent,
            correspondingCategory,
        })

        if (!correspondingCategory) {
            return null
        }

        return { target: 'faq_items' }
    }

    async onEnter() {
        const categories = await this.listFAQCategoriesUseCase.execute(
            this.conversation.company
        )
        const menuOptions: MenuOption[] = categories
            .map((category, index) => ({
                key: (index + 1).toString(),
                label: category.name,
                forClient: true,
                forEmployee: true,
            }))
            .concat([
                {
                    key: 'menu',
                    label: 'Menu principal',
                    forClient: true,
                    forEmployee: true,
                },
            ])
        const listOutput: OutputMessage = {
            type: 'list',
            text: 'Categorias',
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

        this.outputPort.handle(this.conversation.user, listOutput)
    }
}
