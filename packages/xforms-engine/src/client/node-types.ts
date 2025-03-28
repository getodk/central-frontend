// prettier-ignore
export type RepeatRangeNodeType =
	| 'repeat-range:controlled'
	| 'repeat-range:uncontrolled';

// prettier-ignore
export type LeafNodeType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'model-value'
	| 'note'
	| 'select'
	| 'input'
	| 'trigger'
	| 'range'
	| 'rank'
	| 'upload';

// prettier-ignore
export type InstanceNodeType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'root'
	| RepeatRangeNodeType
	| 'repeat-instance'
	| 'group'
	| 'subtree'
	| LeafNodeType;
