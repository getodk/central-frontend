import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { Expression } from '../expression/Expression.ts';
import type {
	AnyFunctionImplementation,
	FunctionImplementation,
} from './FunctionImplementation.ts';
import { UnknownFunctionError } from './FunctionImplementation.ts';

// TODO: memoized boxed name types?
type NamespaceURI = string | null;
type LocalName = string;

interface QualifiedName {
	readonly namespaceURI: NamespaceURI;
	readonly localName: LocalName;
}

export interface LibraryFunction extends AnyFunctionImplementation {
	readonly qualifiedName: QualifiedName;
}

type FunctionLibraryEntry = readonly [
	localName: LocalName,
	implementation: AnyFunctionImplementation,
];

export class FunctionLibrary {
	protected readonly implementations: Map<LocalName, LibraryFunction>;

	constructor(
		readonly namespaceURI: string,
		entries: readonly FunctionLibraryEntry[]
	) {
		const implementations = new Map<LocalName, LibraryFunction>();

		entries.forEach(([entryLocalName, implementation]) => {
			const localName = implementation.localName ?? entryLocalName;

			const qualifiedName: QualifiedName = {
				namespaceURI,
				localName,
			};

			implementations.set(
				localName,
				Object.assign(implementation, {
					qualifiedName,
				})
			);
		});

		this.implementations = implementations;
	}

	has(localName: LocalName): boolean {
		return this.implementations.has(localName);
	}

	call(
		localName: LocalName,
		context: LocationPathEvaluation,
		args: readonly Expression[]
	): Evaluation {
		const implementation = this.implementations.get(localName);

		if (implementation == null) {
			throw new UnknownFunctionError(localName);
		}

		const fn: FunctionImplementation<number> = implementation;

		fn.validateArguments(args);

		return implementation.call(context, args);
	}
}
