import type { Readable } from 'node:stream'

export type FileInput<M extends string = string> =
	| {
			kind: 'buffer'
			data: Buffer | Uint8Array
			size: number
			mimetype: M
			filename: string
	  }
	| {
			kind: 'stream'
			stream: Readable
			size?: number
			mimetype: M
			filename: string
	  }

export type SavedFile<M extends string = string> = {
	id: string
	filename: string
	mimetype: M
	size?: number
	key?: string
}

export abstract class FileService<Accepts extends string> {
	constructor(protected readonly accepts: readonly Accepts[]) {}

	abstract validateMediaType(mt: string): mt is Accepts
	abstract save(
		file: FileInput<Accepts>,
		tenantId?: string
	): Promise<SavedFile<Accepts>>
	abstract removeByKey(key: string, tenantId?: string): Promise<void>
}
