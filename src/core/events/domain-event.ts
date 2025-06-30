export interface DomainEvent {
    ocurredAt: Date
    getAggregateId(): string
}
