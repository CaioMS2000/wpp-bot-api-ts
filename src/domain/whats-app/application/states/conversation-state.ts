import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { TransitionIntent } from '../factory/types'

export abstract class ConversationState<T = unknown> {
    private static readonly TEMPORARY_MARKER = Symbol('TEMPORARY_OUTPUT_PORT')
    private tempOutputPort: OutputPort =
        ConversationState.TEMPORARY_MARKER as unknown as OutputPort

    protected _conversation: Conversation
    protected _outputPort: OutputPort
    protected props: T

    constructor(conversation: Conversation)
    constructor(conversation: Conversation, outputPort: OutputPort)
    constructor(conversation: Conversation, props: T)
    constructor(conversation: Conversation, outputPort: OutputPort, props: T)
    constructor(
        conversation: Conversation,
        outputPortOrProps?: OutputPort | T,
        props?: T
    ) {
        let resolvedOutputPort: OutputPort = this.tempOutputPort
        let resolvedProps: T = null as unknown as T

        // Caso seja passado um OutputPort válido
        if (
            outputPortOrProps &&
            typeof outputPortOrProps === 'object' &&
            'handle' in outputPortOrProps
        ) {
            resolvedOutputPort = outputPortOrProps as OutputPort
            resolvedProps = props ?? resolvedProps
        }
        // Caso seja passado apenas props (sem OutputPort)
        else if (outputPortOrProps && typeof outputPortOrProps === 'object') {
            resolvedProps = outputPortOrProps as T
            // OutputPort continua com valor default
        }
        // Caso seja passado nada além de conversation
        // resolvedOutputPort e resolvedProps já estão nos valores default

        this._conversation = conversation
        this._outputPort = resolvedOutputPort
        this.props = resolvedProps
    }

    get conversation(): Conversation {
        return this._conversation
    }

    get outputPort(): OutputPort {
        if (this._outputPort === this.tempOutputPort || !this._outputPort) {
            throw new Error(
                'OutputPort must be set via constructor or setter before access'
            )
        }
        return this._outputPort
    }

    getOutputPort() {
        if (this._outputPort === this.tempOutputPort || !this._outputPort) {
            return null
        }
        return this._outputPort
    }

    get data() {
        return this.props
    }

    set outputPort(outputPort: OutputPort) {
        this._outputPort = outputPort
    }

    abstract handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>>

    getNextState(message = ''): Promise<Nullable<TransitionIntent>> {
        return Promise.resolve(null)
    }

    onEnter(): Promise<void> | void {
        logger.debug(
            `[onEnter] State: ${this.constructor.name} - Not implemented`
        )
    }

    onExit(): Promise<void> | void {
        logger.debug(
            `[onExit] State: ${this.constructor.name} - Not implemented`
        )
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
