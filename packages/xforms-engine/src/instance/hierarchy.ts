import type { Group } from './Group.ts';
import type { RepeatInstance } from './RepeatInstance.ts';
import type { RepeatRange } from './RepeatRange.ts';
import type { Root } from './Root.ts';
import type { SelectField } from './SelectField.ts';
import type { StringField } from './StringField.ts';
import type { Subtree } from './Subtree.ts';

// prettier-ignore
export type AnyNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| Subtree
	| RepeatRange
	| RepeatInstance
	| StringField
	| SelectField;

// prettier-ignore
export type AnyParentNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| Subtree
	| RepeatRange
	| RepeatInstance;

// prettier-ignore
export type GeneralParentNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| Subtree
	| RepeatInstance;

// prettier-ignore
export type AnyChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Group
	| Subtree
	| RepeatRange
	| RepeatInstance
	| StringField
	| SelectField;

// prettier-ignore
export type GeneralChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Group
	| Subtree
	| RepeatRange
	| StringField
	| SelectField;

// prettier-ignore
export type AnyValueNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| StringField
	| SelectField;
