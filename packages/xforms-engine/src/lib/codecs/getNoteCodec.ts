import type { ValueType } from '../../client/ValueType.ts';
import { sharedValueCodecs } from './getSharedValueCodec.ts';
import { NoteCodec } from './NoteCodec.ts';

type NoteCodecs = {
	readonly [V in ValueType]: NoteCodec<V>;
};

const noteCodecs: NoteCodecs = {
	string: new NoteCodec(sharedValueCodecs.string),
	int: new NoteCodec(sharedValueCodecs.int),
	decimal: new NoteCodec(sharedValueCodecs.decimal),
	boolean: new NoteCodec(sharedValueCodecs.boolean),
	date: new NoteCodec(sharedValueCodecs.date),
	time: new NoteCodec(sharedValueCodecs.time),
	dateTime: new NoteCodec(sharedValueCodecs.dateTime),
	geopoint: new NoteCodec(sharedValueCodecs.geopoint),
	geotrace: new NoteCodec(sharedValueCodecs.geotrace),
	geoshape: new NoteCodec(sharedValueCodecs.geoshape),
	binary: new NoteCodec(sharedValueCodecs.binary),
	barcode: new NoteCodec(sharedValueCodecs.barcode),
	intent: new NoteCodec(sharedValueCodecs.intent),
};

export const getNoteCodec = <V extends ValueType>(valueType: V): NoteCodec<V> => {
	return noteCodecs[valueType];
};
