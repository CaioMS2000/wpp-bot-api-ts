import { DomainEvent } from '../events/domain-event'
import { DomainEvents } from '../events/domain-events'
import { Entity } from './entity'

export abstract class AggregateRoot<Props> extends Entity<Props> {
    private _domainEvents: Array<DomainEvent> = []
    get domainEvents(): Array<DomainEvent> {
        return this._domainEvents
    }
    protected addDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event)
        DomainEvents.markAggregateForDispatch(this)
    }
    clearEvents(): void {
        this._domainEvents = []
    }
}
