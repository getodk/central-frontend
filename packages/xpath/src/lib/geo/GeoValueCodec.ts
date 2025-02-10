// prettier-ignore
export type GeoValueType =
	| 'geopoint'
	| 'geoshape'
	| 'geotrace';

export type GeoValueEncoder<RuntimeInputValue> = (input: RuntimeInputValue) => string;

export type GeoValueDecoder<RuntimeValue> = (value: string) => RuntimeValue;

/**
 * @todo This is based on the same concepts expressed by the extant
 * `@getodk/xforms-engine` `ValueCodec` class. It has been stripped down a more
 * minimal interface, which might form a basis for shared responsibilities for
 * value type support between packages. Its introduction now anticipates an
 * imminent opportunity for sharing logic for the following data types:
 *
 * - {@link https://getodk.github.io/xforms-spec/#data-type:geopoint | geopoint}
 * - {@link https://getodk.github.io/xforms-spec/#data-type:geotrace | geotrace}
 * - {@link https://getodk.github.io/xforms-spec/#data-type:geoshape | geoshape}
 *
 * It makes sense to consider how we share this responsibility as we expand the
 * Web Forms project's support for geo-related features, as there are mutually
 * dependent responsibilities for encoding/decoding between the `@getodk/xpath`
 * and `@getodk/xforms-engine` packages.
 *
 * It's also worth considering how we might address similar shared
 * responsibilities for:
 *
 * - non-geo data types, and potential nuances of how those types are expected
 *   to behave at the boundary between an ODK XForm's model, and the XPath
 *   expressions operating on that model's nodes
 * - XPath casting semantics, and whether/how that responsiblity intersects with
 *   those ODK XForms data types
 */
export interface GeoValueCodec<
	V extends GeoValueType,
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
> {
	readonly valueType: V;
	readonly encodeValue: GeoValueEncoder<RuntimeInputValue>;
	readonly decodeValue: GeoValueDecoder<RuntimeValue>;
}
