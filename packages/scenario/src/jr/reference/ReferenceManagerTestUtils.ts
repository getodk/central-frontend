import type { JavaNIOPath } from '../../java/nio/Path.ts';
import { SharedJRResourceService } from '../../resources/SharedJRResourceService.ts';

/**
 * **PORTING NOTES**
 *
 * This signature is preserved as a reference to the equivalent JavaRosa test
 * setup interface. Some time was spent tracing the actual setup behavior, and
 * it was determined (and since confirmed) that ultimately for test purposes the
 * intent is to register a set of file system paths which are available for
 * resolving fixtures and fixture resources.
 *
 * As such, the actual behavior when calling this function produces the
 * following minimal equivalent behavior:
 *
 * 1. When called, any state produced by a prior call is reset.
 * 2. The string representation of {@link path} establishes a common base file
 *    system path for all state produced by the current call.
 * 3. For each value in {@link schemes} (naming preserved from JavaRosa), a file
 *    system path is produced by concatenating that as a subdirectory of that
 *    common base path.
 * 4. Any logic in the active running test will serve fixture resources from the
 *    set of file system paths produced by the above steps.
 *
 * **Implicitly**, the same state is cleared before and after each test, to
 * avoid establishing shared state between tests which might cause them to
 * become dependent on ordering of test runs.
 */
export const setUpSimpleReferenceManager = (path: JavaNIOPath, ...schemes: string[]): void => {
	const service = SharedJRResourceService.init();

	service.activateFixtures(path.toAbsolutePath().toString(), schemes, {
		get suppressMissingFixturesDirectoryWarning(): boolean {
			const stack = new Error().stack;

			return stack?.includes('configureReferenceManagerIncorrectly') ?? false;
		},
	});
};
