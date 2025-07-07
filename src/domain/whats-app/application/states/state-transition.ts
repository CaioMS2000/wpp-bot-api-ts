import { StateDataMap, StateName } from '../factory/types'

type StateTransitionProps<K extends StateName> = StateDataMap[K] extends null
    ? { targetState: K }
    : { targetState: K; data: StateDataMap[K] }

export class StateTransition<K extends StateName = StateName> {
    constructor(private props: StateTransitionProps<K>) {}

    get targetState(): K {
        return this.props.targetState
    }

    get data(): StateDataMap[K] | null {
        return 'data' in this.props ? this.props.data : null
    }

    static to<K extends StateName>(
        ...args: StateDataMap[K] extends null
            ? [targetState: K]
            : [targetState: K, data: StateDataMap[K]]
    ): StateTransition<K> {
        if (args.length === 1) {
            return new StateTransition({
                targetState: args[0],
            } as StateTransitionProps<K>)
        }

        return new StateTransition({
            targetState: args[0],
            data: args[1],
        } as StateTransitionProps<K>)
    }
}
