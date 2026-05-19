import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';
import type { AttributeContext } from '../../instance/internal-api/AttributeContext.ts';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import type { BindDefinition } from './BindDefinition.ts';
import type { BindElement } from './BindElement.ts';
import { XFORM_EVENT, type XFormEvent } from './Event.ts';

/**
 * Per {@link https://getodk.github.io/xforms-spec/#preload-attributes:~:text=concatenation%20of%20%E2%80%98uuid%3A%E2%80%99%20and%20uuid()}
 */
const PRELOAD_UID_EXPRESSION = 'concat("uuid:", uuid())';

type PartiallyKnownPreloadParameter<Known extends string> = PartiallyKnownString<
	NonNullable<Known>
>;

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
 */
export class BindPreloadDefinition<Type extends PreloadType> implements PreloadInput<Type> {
	static from(
		definition: BindDefinition,
		bindElement: BindElement
	): AnyBindPreloadDefinition | null {
		const input = getPreloadInput(bindElement);

		if (input == null) {
			return null;
		}

		const type = input.type;
		const parameter = input.parameter;
		let event;
		if (definition.form.xformDOM.isInstanceID(bindElement.getAttribute('nodeset'))) {
			event = XFORM_EVENT.odkInstanceLoad;
		} else if (type === 'timestamp' && parameter === 'end') {
			event = XFORM_EVENT.xformsRevalidate;
		} else {
			event = XFORM_EVENT.odkInstanceFirstLoad;
		}
		return new this(type, parameter, event);
	}

	getValue(context: AttributeContext | InstanceValueContext): string | undefined {
		if (this.type === 'uid') {
			return context.evaluator.evaluateString(PRELOAD_UID_EXPRESSION);
		}
		if (this.type === 'timestamp') {
			return context.evaluator.evaluateString('now()');
		}
		if (this.type === 'date') {
			return context.evaluator.evaluateString('today()');
		}
		if (this.type === 'property') {
			const properties = context.instanceConfig.preloadProperties;
			if (this.parameter === 'deviceid') {
				return properties.deviceID;
			}
			if (this.parameter === 'email') {
				return properties.email;
			}
			if (this.parameter === 'phonenumber') {
				return properties.phoneNumber;
			}
			if (this.parameter === 'username') {
				return properties.username;
			}
		}
		return;
	}

	private constructor(
		readonly type: Type,
		readonly parameter: PreloadParameter<Type>,
		readonly event: XFormEvent
	) {}
}

// prettier-ignore
export type AnyBindPreloadDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| BindPreloadDefinition<'uid'>
	| BindPreloadDefinition<'timestamp'>
	| BindPreloadDefinition<'property'>
	| BindPreloadDefinition<string>;
