import { Conversation } from '@/domain/entities/conversation'
import { MenuOption } from '../../@types'
import { StateTransition } from './state-transition'

export abstract class ConversationState<T = unknown> {
    constructor(
        protected conversation: Conversation,
        protected props: T = null as unknown as T
    ) {}

    get data() {
        return this.props
    }

    abstract handleMessage(messageContent: string): StateTransition
    abstract entryMessage: Nullable<string>

    protected formatMenuOptions(options: MenuOption[]): string {
        return options.map(opt => `${opt.key} - ${opt.label}`).join('\n')
    }

    shouldAutoTransition(): boolean {
        return false
    }

    getAutoTransition(): Nullable<StateTransition> {
        return null
    }
}
