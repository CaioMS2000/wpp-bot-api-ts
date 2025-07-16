import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { FAQCategory } from '@/domain/entities/faq'
import { Message } from '@/domain/entities/message'
import { MenuOption } from '../../@types'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { ConversationState } from './conversation-state'
import { StateTypeMapper } from './types'

export class FAQCategoriesState extends ConversationState<null> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase
    ) {
        super(conversation, outputPort)
    }

    async handleMessage(message: Message): Promise<Nullable<StateTypeMapper>> {
        logger.debug('[FAQCategoriesState.handleMessage]\n', {
            message,
        })
        if (message.content === 'Menu principal') {
            return { stateName: 'InitialMenuState' }
        }

        const categories = await this.listFAQCategoriesUseCase.execute(
            this.conversation.company
        )
        const correspondingCategory = categories.find(
            category => category.name === message.content
        )

        logger.debug('[FAQCategoriesState.handleMessage]\n', {
            categories: categories.map(
                cat => `${cat.name} with ${cat.items.length} items`
            ),
            message,
            correspondingCategory,
        })

        if (!correspondingCategory) {
            return null
        }

        return {
            stateName: 'FAQItemsState',
            params: { categoryName: correspondingCategory.name },
        }
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
