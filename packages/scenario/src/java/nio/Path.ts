/**
 * Minimal subset of
 * {@link https://docs.oracle.com/javase/8/docs/api/java/nio/file/Path.html | `java.nio.Path`}
 * necessary to support calls from ported JavaRosa `Scenario` tests.
 */
export interface Path {
	getFileName(): Path;
	getParent(): Path;
	toAbsolutePath(): Path;
	toString(): string;
}

export type { Path as JavaNIOPath };
