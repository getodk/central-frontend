// prettier-ignore
export type RepeatRangeNodeType =
	| 'repeat-range:controlled'
	| 'repeat-range:uncontrolled'

// prettier-ignore
export type InstanceNodeType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'root'
	| RepeatRangeNodeType
	| 'repeat-instance'
	| 'group'
	| 'subtree'
	| 'model-value'
	| 'note'
	| 'select'
	| 'string';
