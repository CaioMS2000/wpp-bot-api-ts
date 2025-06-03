import { Entity } from "@/core/entities/entity";

export type FAQProps = {
    categories: Record<string, any>
}

export class FAQ extends Entity<FAQProps>{
    static create(props: FAQProps, id?: string){
        const faq = new FAQ(props, id)
        return faq
    }

    get categories(){
        return this.props.categories
    }
}