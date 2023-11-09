export type XFormViewControlType =
	| 'text'
	| (string & {
			/* Helps with autocomplete */
	  });

export interface XFormViewControl {
	readonly type: XFormViewControlType;
	readonly ref: string;
	readonly label: string | null;
}

export interface XFormDefinition {
	readonly title: string;
	readonly viewControls: readonly XFormViewControl[];
	readonly xformDocument: XMLDocument;
}
