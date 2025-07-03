import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { TransitionIntent } from '../factory/types'

export abstract class ConversationState<T = unknown> {
    constructor(
        protected conversation: Conversation,
        protected outputPort: OutputPort,
        protected props: T = null as unknown as T
    ) {}

    get data() {
        return this.props
    }

    setOutputPort(outputPort: OutputPort) {
        this.outputPort = outputPort
    }

    abstract handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>>

    getNextState(message = ''): Promise<Nullable<TransitionIntent>> {
        return Promise.resolve(null)
    }

    onEnter(): Promise<void> | void {
        logger.debug(`[onEnter] State: ${this.constructor.name}`)
    }

    onExit(): Promise<void> | void {
        logger.debug(`[onExit] State: ${this.constructor.name}`)
    }

    onTransitionTo(
        newState: Nullable<ConversationState> = null
    ): Promise<void> | void {
        logger.debug(
            `[onTransitionTo] State: ${this.constructor.name} -> ${
                newState?.constructor.name ?? 'null'
            }`
        )
    }
}
