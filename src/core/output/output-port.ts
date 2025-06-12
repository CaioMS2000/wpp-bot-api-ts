export interface OutputPort {
    handle<T = any>(response: T): void | Promise<void>
}
