import { InvalidTypeError } from '@/errors/errors/invalid-type-error'

export function assertFn<T>(val: T | undefined | null, msg: string): T {
	if (val === undefined || val === null) throw new InvalidTypeError(msg)
	return val
}
