import type { Group } from './Group.ts';
import type { ModelValue } from './ModelValue.ts';
import type { Note } from './Note.ts';
import type { RepeatInstance } from './repeat/RepeatInstance.ts';
import type { RepeatRangeControlled } from './repeat/RepeatRangeControlled.ts';
import type { RepeatRangeUncontrolled } from './repeat/RepeatRangeUncontrolled.ts';
import type { Root } from './Root.ts';
import type { SelectField } from './SelectField.ts';
import type { StringField } from './StringField.ts';
import type { Subtree } from './Subtree.ts';

export type RepeatRange = RepeatRangeControlled | RepeatRangeUncontrolled;

// prettier-ignore
export type AnyNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| Subtree
	| RepeatRange
	| RepeatInstance
	| Note
	| ModelValue
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
	| ModelValue
	| Note
	| StringField
	| SelectField;

// prettier-ignore
export type GeneralChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Group
	| Subtree
	| RepeatRange
	| ModelValue
	| Note
	| StringField
	| SelectField;

// prettier-ignore
export type AnyValueNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| ModelValue
	| Note
	| StringField
	| SelectField;
