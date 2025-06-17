import { FAQ, FAQCategory, FAQItem } from '@/domain/entities/faq'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { createSlug } from '@/utils/text'

export class InMemoryFAQRepository extends FAQRepository {
    private data: Record<string, FAQItem & { category: string }> = {}

    constructor() {
        super()

        this.seedInMemoryData()
    }

    async save(
        category: string,
        question: string,
        answer: string
    ): Promise<void> {
        const categorySlug = createSlug(category)
        const questionSlug = createSlug(question)

        this.data[`${categorySlug}-${questionSlug}`] = {
            category,
            question,
            answer,
        }
    }

    async findCategories(): Promise<FAQCategory[]> {
        const categories: Record<string, FAQCategory> = {}

        Object.values(this.data).forEach(item => {
            const categorySlug = createSlug(item.category)
            if (!categories[categorySlug]) {
                categories[categorySlug] = {
                    name: item.category,
                    items: [],
                }
            }
            categories[categorySlug].items.push({
                question: item.question,
                answer: item.answer,
            })
        })

        return Object.values(categories)
    }

    async findItemsByCategory(categoryName: string): Promise<FAQItem[]> {
        const items: FAQItem[] = []

        Object.values(this.data).forEach(item => {
            if (item.category === categoryName) {
                items.push({
                    question: item.question,
                    answer: item.answer,
                })
            }
        })

        return items
    }

    private async seedInMemoryData() {
        this.save(
            'suporte',
            'Como faço para resetar minha senha?',
            'Para resetar sua senha, acesse a página de login e clique em "Esqueci minha senha".'
        )
        this.save(
            'suporte',
            'O sistema está fora do ar, o que fazer?',
            'Primeiro verifique sua conexão com a internet. Se o problema persistir, entre em contato com o suporte técnico.'
        )
        this.save(
            'vendas',
            'Quais são as formas de pagamento aceitas?',
            'Aceitamos cartão de crédito, débito, PIX e boleto bancário.'
        )
        this.save(
            'vendas',
            'Qual o prazo de entrega dos produtos?',
            'O prazo de entrega varia de acordo com sua localização, geralmente entre 3 a 7 dias úteis.'
        )
    }
}
