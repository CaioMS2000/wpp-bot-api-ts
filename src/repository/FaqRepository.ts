export interface FaqEntry {
	question: string
	answer: string
}

export interface FaqCategoryFull {
	id: string
	name: string
}

export interface FaqEntryFull {
	id: string
	question: string
	answer: string
	categoryId: string
}

export interface FaqRepository {
	// Existing read APIs (used by chatbot flows)
	getCategoriesForTenant(tenantId: string): Promise<string[]>
	getFaqForCategory(tenantId: string, category: string): Promise<FaqEntry[]>

	// CRUD for categories
	createCategory(tenantId: string, name: string): Promise<FaqCategoryFull>
	updateCategory(
		tenantId: string,
		id: string,
		name: string
	): Promise<FaqCategoryFull>
	getCategory(tenantId: string, id: string): Promise<FaqCategoryFull | null>
	listCategories(tenantId: string): Promise<FaqCategoryFull[]>
	removeCategory(tenantId: string, id: string): Promise<void>

	// CRUD for entries
	createEntry(
		tenantId: string,
		categoryId: string,
		question: string,
		answer: string
	): Promise<FaqEntryFull>
	updateEntry(
		tenantId: string,
		id: string,
		data: { question?: string; answer?: string; categoryId?: string }
	): Promise<FaqEntryFull>
	getEntry(tenantId: string, id: string): Promise<FaqEntryFull | null>
	listEntries(tenantId: string, categoryId: string): Promise<FaqEntryFull[]>
	removeEntry(tenantId: string, id: string): Promise<void>
}
