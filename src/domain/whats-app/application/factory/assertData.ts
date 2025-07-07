import { StateName, StateDataMap } from '../factory/types'

export function assertData<K extends StateName>(
    state: K,
    data: unknown
): NonNullable<StateDataMap[K]> {
    if (data === undefined || data === null) {
        throw new Error(
            `State '${state}' requires data, but none was provided.`
        )
    }

    return data as NonNullable<StateDataMap[K]>
}
