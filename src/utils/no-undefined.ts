export function omitUndefined<T extends Record<string, any>>(obj: T) {
	return Object.fromEntries(
		Object.entries(obj).filter(([, v]) => v !== undefined)
	) as T
}
