import type { EngineConfig, InitializeFormOptions } from '@getodk/xforms-engine';
import { afterEach, beforeEach } from 'vitest';
import type { JavaNIOPath } from '../../java/nio/Path.ts';
import type { TextFileResourcePath } from '../file/TextFileResourcePath.ts';

/**
 * @todo This is incomplete! It was intended to add preliminary support for
 * resource loading consistent with setup in ported JavaRosa tests. Since we
 * don't yet have any non-form resource loading logic, we'd have no way of
 * exercising the actual functionality. As such, this is currently a sketch of
 * what a basis for that might look like in terms of JavaRosa interface
 * compatibility, test-scoped setup and teardown. When it does become relevant,
 * it will likely intersect with {@link TextFileResourcePath} (or some other
 * similar interface to resource fixtures) to service the pertinent resources as
 * the engine requests them (via {@link EngineConfig}'s `fetchResource` option).
 */
class ResourceManager {
	constructor(
		readonly path: JavaNIOPath,
		readonly jrResourceBasePaths: readonly string[]
	) {}
}

let resourceManagers: ResourceManager[] = [];

beforeEach(() => {
	resourceManagers = [];
});

afterEach(() => {
	resourceManagers = [];
});

/**
 * **PORTING NOTES**
 *
 * The name {@link schemes} has been preserved in the signature of this function
 * (corresponding to JavaRosa's static method of the same name). It somewhat
 * unintuitively **does not** refer to a URL scheme (i.e. `jr:`), but rather the
 * first path segment in a `jr:` resource template URL. For instance, if a form
 * references a file resource `jr://file/external-data.geojson`, a test may set
 * up access to that resource by calling this function and specifying `"files"`
 * as a "scheme".
 *
 * - - -
 *
 * Exposed as a plain function; addresses pertinent aspects of the semantic
 * intent of JavaRosa's same-named static method on the
 * `ReferenceManagerTestUtils` class.
 *
 * Significant divergences:
 *
 * 1. Returns `void`, where JavaRosa's equivalent returns a `ReferenceManager`
 *    (which, per @lognaturel, "nobody likes [...] Don't look :smile:"). This
 *    appears to be safe for now, as there are no current references to its
 *    return value.
 *
 * 2. While also implicitly stateful, the intent is to keep that state scoped as
 *    clearly as possible to a given test (its state being tracked and cleaned
 *    up in an `afterEach` controlled locally in this module as well), and as
 *    minimal as possible to set up the web forms engine's closest semantic
 *    equivalent (the configuration of `config.fetchResource` in
 *    {@link InitializeFormOptions}).
 */
export const setUpSimpleReferenceManager = (path: JavaNIOPath, ...schemes: string[]): void => {
	resourceManagers.push(new ResourceManager(path, schemes));
};
