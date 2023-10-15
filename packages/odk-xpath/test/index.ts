// TODO: These explicit imports currently address two issues...
//
// 1. Vitest browser mode is _extraordinarily slow_ as the number of test suite
//    modules increases. Importing all of these integration tests here speeds up
//    test runs significantly. The TODO action is... very probably moving to a
//    more stable and suitable (non-e2e) browser testing solution.
//
// 2. A more sensible stopgap measure would be glob imports
//    (https://vitejs.dev/guide/features.html#glob-import). But using glob
//    imports causes WebKit test runs to fail mysteriously with "ReferenceError:
//    Cannot access uninitialized variable." The error references a module and
//    line/column offset that doesn't make sense. Rather than trying to diagnose
//    an already temporarily solution, this is another temporary solution atop
//    that one.

import './attributes.spec.ts';
import './basic-xpath.spec.ts';
import './complex.spec.ts';
import './date-comparison.spec.ts';
import './infix-operators.spec.ts';
import './native/axis.spec.ts';
import './native/boolean.spec.ts';
import './native/ceiling.spec.ts';
import './native/comparison-operator.spec.ts';
import './native/comparison-operator2.spec.ts';
import './native/expression-evaluation.spec.ts';
import './native/floor.spec.ts';
import './native/lang.spec.ts';
import './native/namespace-resolver.spec.ts';
import './native/node-name.spec.ts';
import './native/node-type.spec.ts';
import './native/nodeset-id.spec.ts';
import './native/nodeset.spec.ts';
import './native/number-operator.spec.ts';
import './native/number.spec.ts';
import './native/path.spec.ts';
import './native/string.spec.ts';
import './native/union-operator.spec.ts';
import './openrosa-xpath/abs.spec.ts';
import './openrosa-xpath/and-or.spec.ts';
import './openrosa-xpath/area.spec.ts';
import './openrosa-xpath/boolean-from-string.spec.ts';
import './openrosa-xpath/checklist.spec.ts';
import './openrosa-xpath/coalesce.spec.ts';
import './openrosa-xpath/concat.spec.ts';
import './openrosa-xpath/count-non-empty.spec.ts';
import './openrosa-xpath/count-selected.spec.ts';
import './openrosa-xpath/custom.spec.ts';
import './openrosa-xpath/date-time.spec.ts';
import './openrosa-xpath/date.spec.ts';
import './openrosa-xpath/decimal-date-time.spec.ts';
import './openrosa-xpath/decimal-time.spec.ts';
import './openrosa-xpath/digest.spec.ts';
import './openrosa-xpath/ends-with.spec.ts';
import './openrosa-xpath/false.spec.ts';
import './openrosa-xpath/format-date-time.spec.ts';
import './openrosa-xpath/format-date.spec.ts';
import './openrosa-xpath/if.spec.ts';
import './openrosa-xpath/int.spec.ts';
import './openrosa-xpath/join.spec.ts';
import './openrosa-xpath/max.spec.ts';
import './openrosa-xpath/min.spec.ts';
import './openrosa-xpath/not.spec.ts';
import './openrosa-xpath/now.spec.ts';
import './openrosa-xpath/number.spec.ts';
import './openrosa-xpath/once.spec.ts';
import './openrosa-xpath/position.spec.ts';
import './openrosa-xpath/pow.spec.ts';
import './openrosa-xpath/random.spec.ts';
import './openrosa-xpath/randomize.spec.ts';
import './openrosa-xpath/regex.spec.ts';
import './openrosa-xpath/round.spec.ts';
import './openrosa-xpath/selected-at.spec.ts';
import './openrosa-xpath/selected.spec.ts';
import './openrosa-xpath/simple-xpath.spec.ts';
import './openrosa-xpath/subs.spec.ts';
import './openrosa-xpath/sum.spec.ts';
import './openrosa-xpath/today.spec.ts';
import './openrosa-xpath/trigo.spec.ts';
import './openrosa-xpath/true.spec.ts';
import './openrosa-xpath/uuid.spec.ts';
import './openrosa-xpath/weighted-checklist.spec.ts';
import './predicates.spec.ts';
