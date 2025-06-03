import { randomUUID } from "node:crypto";

export class Entity<T>{
    private _id: string
    protected props: T

    get id(){
        return this._id
    }

    protected constructor(props: T, id?: string){
        this.props = props
        this._id = id ?? String(randomUUID());
    }

    public equals(other: Entity<T>): boolean{
        if(other === this) return true;

        if(other.id === this._id) return true;

        return false
    }
}