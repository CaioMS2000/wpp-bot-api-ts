import { Client } from '@/domain/entities/client'
import { Department } from '@/domain/entities/department'
import { FAQItemsStateProps } from './faq-items-state'
import { StateDataMap, StateName } from '../factory/types'

type StateTransitionProps<K extends keyof StateDataMap = StateName> =
    StateDataMap[K] extends null
        ? { targetState: K }
        : { targetState: K; data: StateDataMap[K] }

export class StateTransition<K extends StateName = StateName> {
    constructor(public stateTransitionProps: StateTransitionProps<K>) {
        this.stateTransitionProps = stateTransitionProps
    }

    get targetState(): K {
        return this.stateTransitionProps.targetState
    }

    get data(): Nullable<StateDataMap[K]> {
        if ('data' in this.stateTransitionProps) {
            return this.stateTransitionProps.data
        }

        return null
    }

    static to<K extends keyof StateDataMap>(targetState: K): StateTransition<K>
    static to<K extends keyof StateDataMap>(
        targetState: K,
        data: StateDataMap[K]
    ): StateTransition<K>
    static to<K extends keyof StateDataMap>(
        targetState: K,
        data?: StateDataMap[K]
    ): StateTransition<K> {
        if (data === undefined || data === null) {
            return new StateTransition({
                targetState,
            } as StateTransitionProps<K>)
        }
        return new StateTransition({
            targetState,
            data,
        } as StateTransitionProps<K>)
    }
}
