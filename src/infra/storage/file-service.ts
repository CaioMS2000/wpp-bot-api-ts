import type { Readable } from 'node:stream'
import { BaseFile, FileMeta, FileType, MetaValue } from '@/@types'

export type FileMetaInput = Omit<FileMeta, 'meta'> & {
	meta: {
		tags: string[]
		instruction: string
		[key: string]: MetaValue
	}
}
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

export type StreamReturn<Accepts extends string> = FileType<Accepts> & {
	stream: Readable
}

export type BufferReturn<Accepts extends string> = FileType<Accepts> & {
	buffer: Buffer
}

export abstract class FileService<Accepts extends string> {
	constructor(protected readonly accepts: readonly Accepts[]) {}

	abstract validateMediaType(mt: string): mt is Accepts

	abstract save(
		file: FileInput<Accepts>,
		fileMeta: FileMetaInput,
		...args: any[]
	): Promise<FileType<Accepts>>

	abstract read(key: string, companyId: string): Promise<BufferReturn<Accepts>>
	abstract read(
		key: string,
		companyId: string,
		config: { mode: 'stream' }
	): Promise<StreamReturn<Accepts>>

	abstract list(companyId: string): Promise<BaseFile<Accepts>[]>

	abstract readAll(companyId: string): Promise<Array<BufferReturn<Accepts>>>
	abstract readAll(
		companyId: string,
		config: { mode: 'buffer' }
	): Promise<Array<BufferReturn<Accepts>>>
	abstract readAll(
		companyId: string,
		config: { mode: 'stream' }
	): Promise<Array<StreamReturn<Accepts>>>

	abstract delete(key: string, companyId: string): Promise<void>
}
