interface RootAttributeSource {
	/** @see {@link RootAttributeDefinition.nodeName} */
	readonly nodeName: string;
	readonly value: string;
}

/**
 * @todo This class is named and typed to emphasize its intentionally narrow
 * usage and purpose. It **intentionally** avoids addressing the much broader
 * set of concerns around modeling attributes in primary instance/submissions.
 */
export class RootAttributeDefinition {
	/**
	 * Note: this parameter/property is named and typed to emphasize the fact
	 * that its source is the **prefixed name** of the attribute (e.g. as a
	 * reference to {@link Attr.nodeName}, with the same semantics), as parsed
	 * from a form definition. At time of writing, we have decided that the
	 * safest way to handle such attributes is to preserve their namespace
	 * details **as authored**.
	 */
	readonly nodeName: string;
	readonly value: string;

	constructor(source: RootAttributeSource) {
		this.nodeName = source.nodeName;
		this.value = source.value;
	}
}
