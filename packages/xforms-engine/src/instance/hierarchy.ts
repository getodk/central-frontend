import type { Attribute } from './Attribute.ts';
import type { Group } from './Group.ts';
import type { AnyInputControl } from './InputControl.ts';
import type { AnyModelValue } from './ModelValue.ts';
import type { AnyNote } from './Note.ts';
import type { PrimaryInstance } from './PrimaryInstance.ts';
import type { AnyRangeControl } from './RangeControl.ts';
import type { RankControl } from './RankControl.ts';
import type { RepeatInstance } from './repeat/RepeatInstance.ts';
import type { RepeatRangeControlled } from './repeat/RepeatRangeControlled.ts';
import type { RepeatRangeUncontrolled } from './repeat/RepeatRangeUncontrolled.ts';
import type { Root } from './Root.ts';
import type { SelectControl } from './SelectControl.ts';
import type { TriggerControl } from './TriggerControl.ts';
import type { UploadControl } from './UploadControl.ts';

export type RepeatRange = RepeatRangeControlled | RepeatRangeUncontrolled;

// prettier-ignore
export type AnyNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| PrimaryInstance
	| Root
	| Group
	| RepeatRange
	| RepeatInstance
	| AnyNote
	| AnyModelValue
	| AnyInputControl
	| AnyRangeControl
	| RankControl
	| SelectControl
	| TriggerControl
	| UploadControl;

// prettier-ignore
export type AnyParentNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| PrimaryInstance
	| Root
	| Group
	| RepeatRange
	| RepeatInstance;

// prettier-ignore
export type GeneralParentNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| RepeatInstance;

// prettier-ignore
export type AnyChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| RepeatRange
	| RepeatInstance
	| AnyModelValue
	| AnyNote
	| AnyInputControl
	| AnyRangeControl
	| RankControl
	| SelectControl
	| TriggerControl
	| UploadControl
	| Attribute;

// prettier-ignore
export type GeneralChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Group
	| RepeatRange
	| AnyModelValue
	| AnyNote
	| AnyInputControl
	| AnyRangeControl
	| RankControl
	| SelectControl
	| TriggerControl
	| UploadControl;

// prettier-ignore
export type AnyValueNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| AnyModelValue
	| AnyNote
	| AnyInputControl
	| AnyRangeControl
	| RankControl
	| SelectControl
	| TriggerControl
	| UploadControl;
