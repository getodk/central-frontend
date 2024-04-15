interface PathResourceOptions {
	readonly formName?: string;
}

export class PathResource {
	readonly formName: string;

	constructor(
		readonly path: string,
		readonly formXML: string,
		options: PathResourceOptions = {}
	) {
		this.formName = options.formName ?? path.replace(/\/([^/]+)$/, '$1');
	}
}
