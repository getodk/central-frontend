import { ENKETO_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { FunctionAlias } from '../../evaluator/functions/FunctionAlias.ts';
import { FunctionLibrary } from '../../evaluator/functions/FunctionLibrary.ts';
import { date, formatDateTime } from '../xforms/datetime.ts';

export const enk = new FunctionLibrary(ENKETO_NAMESPACE_URI, [
	new FunctionAlias('date-time', date),
	new FunctionAlias('format-date', formatDateTime),
]);
