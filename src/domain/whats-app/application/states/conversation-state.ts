import { Conversation } from '@/domain/entities/conversation'
import { StateTransition } from './state-transition'
import { OutputPort } from '@/core/output/output-port'
import { logger } from '@/core/logger'

export type ConversationStateConfig = {
    outputPort?: Nullable<OutputPort>
}
export const conversationStateDefaultConfig: ConversationStateConfig = {
    outputPort: null,
}
export abstract class ConversationState<T = unknown> {
    constructor(
        protected conversation: Conversation,
        protected props: T = null as unknown as T,
        protected config: ConversationStateConfig = conversationStateDefaultConfig
    ) {}

    get data() {
        return this.props
    }

    abstract handleMessage(messageContent: string): StateTransition

    shouldAutoTransition(): boolean {
        return false
    }

    getAutoTransition(): Nullable<StateTransition> {
        return null
    }

    onEnter(): Promise<void> | void {
        logger.debug(`[onEnter] State: ${this.constructor.name}`)
    }
    onExit(): Promise<void> | void {
        logger.debug(`[onExit] State: ${this.constructor.name}`)
    }
}
