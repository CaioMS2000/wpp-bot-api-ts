import { Conversation } from '@/domain/entities/conversation'
import { StateTransition } from './state-transition'
import { MenuOption, StateInfo } from '../../@types'

export abstract class ConversationState {
    protected conversation: Conversation

    constructor(conversation: Conversation) {
        this.conversation = conversation
    }

    abstract handleMessage(messageContent: string): StateTransition
    abstract getMenuOptions(): MenuOption[]
    abstract getStateInfo(): StateInfo
}
