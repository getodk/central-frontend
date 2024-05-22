import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';

/**
 * Like JavaRosa. Presumably for explicit types which aren't impelemnted?
 */
const UNSUPPORTED_DATA_TYPE = 'UNSUPPORTED';

export type UnsupportedDataType = typeof UNSUPPORTED_DATA_TYPE;

/**
 * Like JavaRosa. Presumably for e.g. groups with explicit binds (`relevant` etc)?
 */
const NULL_DATA_TYPE = 'NULL';

export type NullDataType = typeof NULL_DATA_TYPE;

/**
 * As in ODK XForms Spec.
 *
 * TODO: it's unclear why JavaRosa's `DataType` hews closely to the spec, but
 * has certain differences (e.g. string -> TEXT, int -> INTEGER). It's also
 * not immediately clear how additive types like CHOICE and MULTIPLE_ITEMS
 * square with the underlying spec types.
 */
export const XFORM_SPEC_DATA_TYPES = [
	'string',
	'int',
	'boolean',
	'decimal',
	'date',
	'time',
	'dateTime',
	'geopoint',
	'geotrace',
	'geoshape',
	'binary',
	'barcode',
	'intent',
] as const;

const isSupportedDataType = (bindType: string): bindType is XFormSpecDataType =>
	XFORM_SPEC_DATA_TYPES.includes(bindType as XFormSpecDataType);

export type XFormSpecDataType = CollectionValues<typeof XFORM_SPEC_DATA_TYPES>;

export type XFormDataType = NullDataType | UnsupportedDataType | XFormSpecDataType;

const DEFAULT_XFORM_DATA_TYPE = 'string';

export type DefaultXFormDataType = typeof DEFAULT_XFORM_DATA_TYPE;

// TODO: groups -> NULL?
// TODO: XSD namespace
export const bindDataType = (bindType: string | null): XFormDataType => {
	if (bindType == null) {
		return DEFAULT_XFORM_DATA_TYPE;
	}

	if (isSupportedDataType(bindType)) {
		return bindType;
	}

	return UNSUPPORTED_DATA_TYPE;
};
