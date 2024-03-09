import { JAVAROSA_NAMESPACE_URI } from '@odk-web-forms/common/constants/xmlns';
import { FunctionLibrary } from '../../evaluator/functions/FunctionLibrary';
import * as string from './string.ts';

export const jr = new FunctionLibrary(JAVAROSA_NAMESPACE_URI, [...Object.values(string)]);
