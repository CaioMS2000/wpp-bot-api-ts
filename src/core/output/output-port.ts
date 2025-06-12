export type OutputPort = {
    handle<T = any>(response: T): void | Promise<void>
    // handle: <T = any>(response: T) => void | Promise<void>
}

// export interface OutputPort {
// handle<T = any>(response: T): void | Promise<void>
// handle: <T = any>(response: T) => void | Promise<void>
// }
