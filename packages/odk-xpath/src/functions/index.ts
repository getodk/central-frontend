import { FN_NAMESPACE_URI } from '../evaluator/NamespaceResolver.ts';
import { FunctionLibrary } from '../evaluator/functions/FunctionLibrary.ts';
import * as enketoImplementations from './enketo/index.ts';
import * as fnImplementations from './fn/index.ts';
import * as xformsImplementations from './xforms/index.ts';

export const fn = new FunctionLibrary(
  FN_NAMESPACE_URI,
  [
    ...Object.entries(fnImplementations),
    ...Object.entries(xformsImplementations),
    // TODO: remove(?)
    ...Object.entries(enketoImplementations),
  ]
);
