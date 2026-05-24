// prettier-ignore
export type JSONValue =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| boolean
	| number
	| string
	| null
	| JSONArray
	| JSONObject;

export type JSONArray = readonly JSONValue[];

// This must be an interface to avoid a circular type reference error
export interface JSONObject {
	readonly [key: string]: JSONValue;
}
