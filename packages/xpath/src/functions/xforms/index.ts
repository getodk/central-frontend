import { XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { FunctionLibrary } from '../../evaluator/functions/FunctionLibrary.ts';
import * as boolean from './boolean.ts';
import * as datetime from './datetime.ts';
import * as geo from './geo.ts';
import * as nodeset from './node-set.ts';
import * as number from './number.ts';
import * as select from './select.ts';
import * as string from './string.ts';

export const xf = new FunctionLibrary(XFORMS_NAMESPACE_URI, [
	...Object.values(boolean),
	...Object.values(datetime),
	...Object.values(geo),
	...Object.values(number),
	...Object.values(nodeset),
	...Object.values(select),
	...Object.values(string),
]);
