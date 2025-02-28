import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';
import type { BindElement } from './BindElement.ts';

type PartiallyKnownPreloadParameter<Known extends string> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	PartiallyKnownString<NonNullable<Known>> | Extract<Known, null>;

interface PreloadParametersByType {
	readonly uid: string | null;
	readonly date: PartiallyKnownPreloadParameter<'today'>;
	readonly timestamp: PartiallyKnownPreloadParameter<'end' | 'start'>;

	readonly property: PartiallyKnownPreloadParameter<
		// prettier-ignore
		'deviceid' | 'email' | 'phonenumber' | 'username'
	>;
}

type PreloadType = PartiallyKnownString<keyof PreloadParametersByType>;

// prettier-ignore
type PreloadParameter<Type extends PreloadType> =
	Type extends keyof PreloadParametersByType
		? PreloadParametersByType[Type]
		: string | null;

interface PreloadInput<Type extends PreloadType> {
	readonly type: Type;
	readonly parameter: PreloadParameter<Type>;
}

type AnyPreloadInput = {
	[Type in PreloadType]: PreloadInput<Type>;
}[PreloadType];

const getPreloadInput = (bindElement: BindElement): AnyPreloadInput | null => {
	const type = bindElement.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'preload');

	if (type == null) {
		return null;
	}

	const parameter: PreloadParameter<typeof type> = bindElement.getAttributeNS(
		JAVAROSA_NAMESPACE_URI,
		'preloadParams'
	);

	return {
		type,
		parameter,
	};
};

/**
 * Parsed representation of
 * {@link https://getodk.github.io/xforms-spec/#preload-attributes | Preload Attributes}.
 * If specified on a
 * {@link https://getodk.github.io/xforms-spec/#bindings | binding}, this will
 * be parsed to define:
 *
 * - {@link type}, a `jr:preload`
 * - {@link parameter}, an associated `jr:preloadParams` value
 *
 * @todo It would probably make sense for the _definition_ to also convey:
 *
 * 1. Which {@link https://getodk.github.io/xforms-spec/#events | event} the
 *    preload is semantically associated with (noting that the spec may be a tad
 *    overzealous about this association).
 *
 * 2. The constant XPath expression (or other computation?) expressed by the
 *    combined {@link type} and {@link parameter}.
 */
export class BindPreloadDefinition<Type extends PreloadType> implements PreloadInput<Type> {
	static from(bindElement: BindElement): AnyBindPreloadDefinition | null {
		const input = getPreloadInput(bindElement);

		if (input == null) {
			return null;
		}

		return new this(input);
	}

	readonly type: Type;
	readonly parameter: PreloadParameter<Type>;

	private constructor(input: PreloadInput<Type>) {
		this.type = input.type;
		this.parameter = input.parameter;
	}
}

// prettier-ignore
export type AnyBindPreloadDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| BindPreloadDefinition<'uid'>
	| BindPreloadDefinition<'timestamp'>
	| BindPreloadDefinition<'property'>
	| BindPreloadDefinition<string>;
