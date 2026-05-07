import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { FunctionLibrary } from '../../evaluator/functions/FunctionLibrary';
import * as nodeSet from './node-set.ts';
import * as select from './select.ts';

export const jr = new FunctionLibrary(JAVAROSA_NAMESPACE_URI, [
	...Object.values(nodeSet),
	...Object.values(select),
]);
