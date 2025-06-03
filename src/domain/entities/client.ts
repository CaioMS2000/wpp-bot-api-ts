import { Entity } from "@/core/entities/entity";

export type ClientProps = {
    phone: string
    state: any
    department: string
    event_history: any[]
}

export class Client extends Entity<ClientProps>{
    static create(props: ClientProps, id?: string){
        const client = new Client(props, id)
        return client
    }

    get phone(){
        return this.props.phone
    }

    get state(){
        return this.props.state
    }

    get department(){
        return this.props.department
    }

    get event_history(){
        return this.props.event_history
    }
}