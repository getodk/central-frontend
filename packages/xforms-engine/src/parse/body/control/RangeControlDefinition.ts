import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { RangeAppearanceDefinition } from '../appearance/rangeAppearanceParser.ts';
import { rangeAppearanceParser } from '../appearance/rangeAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

type NumericString = `${number}`;

/**
 * @todo this should likely become a basis for generalizing how we parse number
 * values from strings. Note for when we take that on: number semantics vary
 * between:
 *
 * - {@link https://www.w3.org/TR/1999/REC-xpath-19991116/#numbers | XPath}:
 *   XPath "64-bit [...] IEEE 754" number values are almost totally consistent
 *   with JavaScript numbers; the main difference is that JavaScript's
 *   {@link Number} factory is more flexible in casting from string than the
 *   casting semantics specified by XPath
 *
 * - {@link https://getodk.github.io/xforms-spec/#data-types | [ODK] XForms}:
 *   specifies both `int` and `decimal` types. Decimals are **NOT** expected to
 *   have the same precision tradeoffs as IEEE 754 numbers, and we'll want to
 *   take special care that parsing does not introduce precision errors.
 */
const NUMERIC_STRING_PATTERN = /^-?\d+(\.\d+)?$/;

const isNumericString = (value: string): value is NumericString => {
	return NUMERIC_STRING_PATTERN.test(value);
};

type AssertNumericStringAttribute = (
	localName: string,
	value: string | null
) => asserts value is NumericString;

const assertNumericStringAttribute: AssertNumericStringAttribute = (localName, value) => {
	if (value == null) {
		throw new ErrorProductionDesignPendingError(`Expected attribute ${localName} is not defined`);
	}

	if (!isNumericString(value)) {
		throw new ErrorProductionDesignPendingError(
			`Expected attribute ${localName} to be defined with numeric string, got: ${JSON.stringify(value)}`
		);
	}
};

const parseNumericStringAttribute = (element: Element, localName: string): NumericString => {
	const value = element.getAttribute(localName);

	assertNumericStringAttribute(localName, value);

	return value;
};

/**
 * Per
 * {@link https://getodk.github.io/xforms-spec/#body-elements | ODK XForms spec},
 * the following attributes are required:
 *
 * - `start`
 * - `end`
 * - `step`
 *
 * While we also know that a `<range>` control is expected to have a bind type
 * of either `decimal` or `int`, at this parsing stage we do not yet know which
 * type is associated with the control. So we parse the attributes as strings,
 * checking only that they appear to be numeric values. We also preserve the
 * attributes' names here, for consistency with the spec.
 *
 * Downstream, we parse these to their appropriate numeric runtime types, and
 * alias them to their more conventional names (i.e. "start" -> "min", "end" ->
 * "max").
 */
export class RangeControlBoundsDefinition {
	static from(element: Element) {
		const start = parseNumericStringAttribute(element, 'start');
		const end = parseNumericStringAttribute(element, 'end');
		const step = parseNumericStringAttribute(element, 'step');

		return new this(start, end, step);
	}

	constructor(
		readonly start: NumericString,
		readonly end: NumericString,
		readonly step: NumericString
	) {}
}

export class RangeControlDefinition extends ControlDefinition<'range'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'range';
	}

	readonly type = 'range';
	readonly appearances: RangeAppearanceDefinition;
	readonly bounds: RangeControlBoundsDefinition;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = rangeAppearanceParser.parseFrom(element, 'appearance');
		this.bounds = RangeControlBoundsDefinition.from(element);
	}

	override toJSON(): object {
		return {};
	}
}
