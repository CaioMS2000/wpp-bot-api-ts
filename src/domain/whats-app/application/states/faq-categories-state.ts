import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { FAQCategory } from '@/domain/entities/faq'
import { MenuOption } from '../../@types'
import { TransitionIntent } from '../factory/types'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { ConversationState } from './conversation-state'

export type FAQCategoriesStateProps = { categories: FAQCategory[] }
export class FAQCategoriesState extends ConversationState<FAQCategoriesStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase
    ) {
        super(conversation, outputPort)
    }

    get categories() {
        return this.props.categories
    }

    set categories(categories: FAQCategory[]) {
        this.props.categories = categories
    }

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        if (messageContent === 'Menu principal') {
            return { target: 'initial_menu' }
        }

        const correspondingCategory = this.categories.find(
            category => category.name === messageContent
        )

        if (!correspondingCategory) {
            return null
        }

        return { target: 'faq_items' }
    }

    async onEnter() {
        this.categories = await this.listFAQCategoriesUseCase.execute(
            this.conversation.company
        )
        const menuOptions: MenuOption[] = this.categories
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
