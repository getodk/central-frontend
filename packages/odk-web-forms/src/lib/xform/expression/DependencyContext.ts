import type { AnyDependentExpression } from './DependentExpression.ts';

export abstract class DependencyContext {
	abstract get parentReference(): string | null;
	abstract get reference(): string | null;

	protected readonly dependentExpressions = new Set<AnyDependentExpression>();

	protected dependencyExpressionsCache: ReadonlySet<string> | null = null;

	get dependencyExpressions(): ReadonlySet<string> {
		let { dependencyExpressionsCache } = this;

		if (dependencyExpressionsCache == null) {
			dependencyExpressionsCache = new Set(
				Array.from(this.dependentExpressions).flatMap((expression) => {
					return Array.from(expression.dependencyReferences);
				})
			);
			this.dependencyExpressionsCache = dependencyExpressionsCache;
		}

		return dependencyExpressionsCache;
	}

	get isTranslated(): boolean {
		return this._isTranslated;
	}

	// Note: this is a bit of type system "cleverness" that helped to prevent a
	// bug repeatedly encountered in earlier prototyping. The default value is
	// false (currently backed by _isTranslated; this note should be updated if
	// that changes). Its value can be read at any time, but it may only be
	// overridden with `true`. So if a `DependencyContext` is established as
	// dependent on translations by one `DependentExpression`, another expression
	// which does not depend on translations cannot override that.
	//
	// This doesn't deserve so much explanation in its own right, but it's worth
	// calling out here as a pattern we may find valuable in other cases where
	// interfaces allow writes from outside (which I've generally tried to avoid,
	// or significantly restrict, to avoid bugs like the one described above).
	set isTranslated(value: true) {
		this._isTranslated = value;
	}

	// Update note on `set isTranslated` if this internal storage changes.
	protected _isTranslated = false;

	registerDependentExpression(expression: AnyDependentExpression): void {
		this.dependencyExpressionsCache = null;
		this.dependentExpressions.add(expression);
	}
}
