import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { NamespaceDeclaration } from './NamespaceDeclaration.ts';
import type { NamespaceURI, QualifiedName } from './QualifiedName.ts';

export interface NamedNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

type NamedNodeDefinitionMap = ReadonlyMap<QualifiedName, NamedNodeDefinition>;

export interface NamedSubtreeDefinition extends NamedNodeDefinition {
	readonly namespaceDeclarations: NamespaceDeclarationMap;
	readonly parent: NamedSubtreeDefinition | null;
	readonly attributes?: NamedNodeDefinitionMap;
}

/**
 * @todo This is a bit of a code style experiment! Responsive to
 * {@link https://github.com/getodk/web-forms/issues/296 | How should we represent enumerated types?}.
 * Observations to be considered for that issue...
 *
 * This more or less works as one would expect, with one really irritating
 * downside: unlike a **TypeScript `enum`**, code completions (in VSCode, but
 * I'd expect the same for any TypeScript language server/LSP implementation)
 * automatically suggest the bare string values rather than the equivalent
 * syntax referencing the enumerations as defined here. Without care, it would
 * be fairly trivial to lose consistency between the source "enum" and consuming
 * code which we presume to be an exhaustive check (such as the `switch`
 * statement operating on it below). This is somewhat mitigated for now by
 * habitual use of {@link UnreachableError} (and would be better mitigated by a
 * lint rule to enforce exhaustiveness checks over similar enumerations). But
 * there is an obvious _stylistic mismatch_ between how an editor treats "thing
 * shaped like `enum` but not semantically an `enum`", whereas there's no such
 * mismatch in how it treats a plain "union of strings". If nothing else, that
 * mismatch would tend to exacerbate exhaustiveness drift as an enumeration
 * evolves.
 */
const DECLARE_NAMESPACE_RESULTS = {
	SUCCESS: 'SUCCESS',
	HOISTED: 'HOISTED',
	DEFERRED: 'DEFERRED',
	REDUNDANT: 'REDUNDANT',
	CONFLICT: 'CONFLICT',
} as const;

type DeclareNamespaceResultEnum = typeof DECLARE_NAMESPACE_RESULTS;

type DeclareNamespaceResult = DeclareNamespaceResultEnum[keyof DeclareNamespaceResultEnum];

export class NamespaceDeclarationMap extends Map<string | null, NamespaceDeclaration> {
	constructor(readonly subtree: NamedSubtreeDefinition) {
		super();

		this.declareNamespace(subtree);

		const { attributes } = subtree;

		if (attributes != null) {
			for (const attribute of attributes.values()) {
				this.declareNamespace(attribute);
			}
		}
	}

	/**
	 * For any {@link definition | named node definition}, we can _infer_ a
	 * namespace declaration (rather than parsing it directly, which is error
	 * prone depending on parsing context) from that definition's
	 * {@link QualifiedName.namespaceURI} and {@link QualifiedName.prefix} (if the
	 * latter is defined).
	 *
	 * If a namespace declaration can be inferred, we "declare" (set, in
	 * {@link Map} semantics) it in **EITHER**:
	 *
	 * - An ancestor {@link NamedSubtreeDefinition | named subtree definition}'s
	 *   {@link NamespaceDeclarationMap}: if such an ancestor exists and has no
	 *   conflicting declaration for the same prefix; **OR**
	 * - This {@link NamespaceDeclarationMap}, if no suitable ancestor exists
	 *
	 * This can be described as "hoisting" the declaration to the uppermost node
	 * (or definitional representation of same) where it would be valid to declare
	 * the namespace for its prefix.
	 *
	 * In the following example, note that this logic applies for arbitrary tree
	 * structures satisfying the {@link NamedNodeDefinition} and
	 * {@link NamedSubtreeDefinition} interfaces. XML syntax is used to provide a
	 * concise explanation, but it should not be inferred that this is operating
	 * directly on an XML value (or any platform-native DOM structure of the
	 * same).
	 *
	 * @example Given an input tree like:
	 *
	 * ```xml
	 * <foo xmlns="https://example.com/DEFAULT_ONE">
	 *   <bar:bat xmlns:bar="https://example.com/bar"/>
	 *   <baz xmlns="https://example.com/DEFAULT_TWO"/>
	 * </foo>
	 * ```
	 *
	 * The namespace declarations will be assigned as if they'd been declared
	 * like:
	 *
	 * ```xml
	 * <foo
	 *   xmlns="https://example.com/DEFAULT_ONE"
	 *   xmlns:bar="https://example.com/bar"
	 * >
	 *   <!-- bar declaration has no conflict in foo, hoisted to parent -->
	 *   <bar:bat/>
	 *   <!-- default declaration conflicts with foo's default, not hoisted -->
	 *   <baz xmlns="https://example.com/DEFAULT_TWO"/>
	 * </foo>
	 * ```
	 *
	 * **IMPORTANT:** this behavior may seem overly complicated! It should be
	 * noted that the behavior:
	 *
	 * 1. ... is conceptually similar to behavior observable in a web standard
	 *    WHAT Working Group DOM (as in browser DOM, XML DOM) implementation.
	 *    There, serializing any subtree element will produce namespace
	 *    declarations on the root element for any namespaces _referenced within
	 *    its subtree but declared on an ancestor_. Note that in this case, the
	 *    hierarchical behavior is inverted, but it demonstrates the same
	 *    effective namespace scoping semantics.
	 *
	 * 2. ... vastly simplifies our ability to produce a compact XML
	 *    representation from any arbitrary tree representation of its nodes.
	 *    Hoisting namespace declarations to their uppermost scope, and
	 *    deduplicating recursively up the ancestor tree, ensures that we only
	 *    declare a given namespace once as it is referenced.
	 *
	 * @todo While this design is intended to help with producing compact
	 * serialized XML, at time of writing there is still an aspect which is
	 * unaddressed in the serialization logic: we assume namespace declarations
	 * are referenced if they've been parsed. This logic doesn't hold for nodes
	 * which are ultimately omitted from serialization, which would occur for
	 * non-relevant nodes, and repeat ranges with zero repeat instances (or any of
	 * their descendants). A future iteration of this same behavior could produce
	 * XML which is theoretically more compact, by performing the same declaration
	 * hoisting logic _dynamically at call time_ rather than at parse time.
	 */
	declareNamespace(definition: NamedNodeDefinition): DeclareNamespaceResult {
		const { prefix, namespaceURI } = definition.qualifiedName;

		if (typeof prefix === 'symbol') {
			return DECLARE_NAMESPACE_RESULTS.DEFERRED;
		}

		const parentNamespaceDeclarations = this.subtree.parent?.namespaceDeclarations;

		if (parentNamespaceDeclarations != null) {
			const ancestorResult = parentNamespaceDeclarations.declareNamespace(definition);

			switch (ancestorResult) {
				case DECLARE_NAMESPACE_RESULTS.CONFLICT:
					break;

				case DECLARE_NAMESPACE_RESULTS.DEFERRED:
					return ancestorResult;

				case DECLARE_NAMESPACE_RESULTS.HOISTED:
					return ancestorResult;

				case DECLARE_NAMESPACE_RESULTS.SUCCESS:
				case DECLARE_NAMESPACE_RESULTS.REDUNDANT:
					return DECLARE_NAMESPACE_RESULTS.HOISTED;

				default:
					throw new UnreachableError(ancestorResult);
			}
		}

		const currentDeclaration = this.get(prefix);

		if (currentDeclaration == null) {
			this.set(
				prefix,
				new NamespaceDeclaration({
					declaredPrefix: prefix,
					declaredURI: namespaceURI,
				})
			);

			return DECLARE_NAMESPACE_RESULTS.SUCCESS;
		}

		if (currentDeclaration.declaresNamespaceURI(namespaceURI)) {
			return DECLARE_NAMESPACE_RESULTS.REDUNDANT;
		}

		return DECLARE_NAMESPACE_RESULTS.CONFLICT;
	}

	/**
	 * Given a {@link namespaceURI}, resolves a declared prefix (which may be
	 * `null`) for the {@link subtree} context **or any of its ancestors**. This
	 * is an important semantic detail:
	 *
	 * - Namespace declarations on a given subtree are effective for all of its
	 *   descendants _until another declaration for the same prefix or namespace
	 *   URI is encountered_
	 * - We "hoist" namespace declarations up to the uppermost {@link subtree}'s
	 *   {@link NamespaceDeclarationMap} during parsing (as described in more
	 *   detail on {@link declareNamespace}).
	 */
	lookupPrefix(namespaceURI: NamespaceURI): string | null {
		const namespace = String(namespaceURI);

		// Note: this is a dynamic lookup on the _very unlikely_ chance that a
		// lookup occurs while parsing is still in progress. It's expected that we
		// collect all namespace declarations by the time parsing is complete, at
		// which point we could theoretically collect a companion map where the
		// namespace URI is used as a key. This has been deferred for now, because
		// we'd need:
		//
		// 1. To know _in this class_ when parsing is complete (which seems like a
		//    huge excess of mixed responsibilities!)
		// 2. To resolve the "object-as-value-as-map-key" problem, which has also
		//    been deferred.
		for (const namespaceDeclaration of this.values()) {
			if (String(namespaceDeclaration.declaredURI) === namespace) {
				return namespaceDeclaration.declaredPrefix;
			}
		}

		return this.subtree.parent?.namespaceDeclarations.lookupPrefix(namespaceURI) ?? null;
	}
}
