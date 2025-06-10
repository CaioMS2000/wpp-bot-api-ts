import { Conversation } from '@/domain/entities/conversation'
import { MenuOption } from '../../@types'
import { StateTransition } from './state-transition'

export abstract class ConversationState {
    protected conversation: Conversation

    constructor(conversation: Conversation) {
        this.conversation = conversation
    }

    abstract handleMessage(messageContent: string): StateTransition
    abstract getResponse(): string

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
