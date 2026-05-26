import type { JavaNIOPath } from '../../java/nio/Path.ts';
import { FileSystemPath } from './FileSystemPath.ts';

/**
 * Provides both:
 *
 * - the interface of a
 *   {@link https://docs.oracle.com/javase/8/docs/api/java/nio/file/Path.html | `java.nio.Path`}
 * - a generalized mechanism to provide synchronous access to the text of a file
 *   resource corresponding to that path; the actual text contents of the file
 *   will often (but not necessarily) be read from an actual file system object
 *   within the web forms project
 *
 * The intent of this abstraction is to establish a hard boundary between async
 * IO (typical of JavaScript runtimes under most circumstances) and synchronous
 * access as expressed in many present JavaRosa tests (and their pertinent
 * supporting interfaces).
 *
 * In many cases, we will **also** have synchronous access to these resources
 * (such as reading fixures with an eager-loading
 * {@link https://vitejs.dev/guide/features#glob-import | `import.meta.glob`}
 * call). But establishing this hard boundary provides flexibility in
 * determining how/when we wish to exercise more platform-specific aspects of
 * resource loading. It similarly preserves flexibility in determining how/when
 * we wish to backport any new tests originating in web forms to JavaRosa.
 *
 * It is a bit awkward to couple "path" and "resource" concepts into the same
 * interface, but at least for now it seems that it would be considerably
 * **more** awkward to build the supporting infrastructure for resolving
 * path-only concepts to resource-only concepts while also accommodating the
 * above considerations around synchrony and cross-platform consideration.
 */
export class TextFileResourcePath extends FileSystemPath implements JavaNIOPath {
	constructor(
		sourcePath: JavaNIOPath | string,
		readonly textContents: string
	) {
		super(sourcePath);
	}
}
