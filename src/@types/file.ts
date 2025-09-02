export type MetaValue =
	| string
	| number
	| boolean
	| string[]
	| MetaValue[]
	| { [key: string]: MetaValue }
	| null
	| undefined

export type _Meta = {
	tags: string[]
	instruction: string
	storageId: string
	indexInStorage: string
	[key: string]: MetaValue
}
export type FileMeta = {
	declaredMime?: string
	meta: _Meta
	tenantId?: string
}

export type BaseFile<M extends string = string> = {
	key: string
	filename: string
	mime: M
	meta: _Meta
	size: number
}

export type FileType<M extends string = string> = BaseFile<M> & {
	id: string
	checksum?: string
	createdAt: Date
}
