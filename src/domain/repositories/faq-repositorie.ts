import { FAQ } from '../entities/faq'

export abstract class FAQRepository {
    abstract findFirst(): Promise<FAQ | null>
}
