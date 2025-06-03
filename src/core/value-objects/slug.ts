export class Slug {
	public text: string;

	private constructor(text: string) {
		this.text = text;
	}

	static create(text: string) {
		return new Slug(text);
	}

	static createFromText(text: string) {
		const slugText = text
			.normalize("NFKD")
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]+/g, "")
			.replace(/_/g, "-")
			.replace(/--+/g, "-")
			.replace(/-$/g, "")
        
        return new Slug(slugText)
	}
}
