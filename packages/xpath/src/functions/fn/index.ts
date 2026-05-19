import { FN_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { FunctionLibrary } from '../../evaluator/functions/FunctionLibrary.ts';
import * as boolean from './boolean.ts';
import * as nodeset from './node-set.ts';
import * as number from './number.ts';
import * as string from './string.ts';

export const fn = new FunctionLibrary(FN_NAMESPACE_URI, [
	...Object.values(boolean),
	...Object.values(nodeset),
	...Object.values(number),
	...Object.values(string),
]);
