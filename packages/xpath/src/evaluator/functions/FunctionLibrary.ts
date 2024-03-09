import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type {
	AnyFunctionImplementation,
	EvaluableArgument,
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

export class FunctionLibrary {
	protected readonly implementations: Map<LocalName, LibraryFunction>;

	constructor(
		readonly namespaceURI: string,
		entries: readonly AnyFunctionImplementation[]
	) {
		const implementations = new Map<LocalName, LibraryFunction>();

		entries.forEach((implementation) => {
			const { localName } = implementation;

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
		args: readonly EvaluableArgument[]
	): Evaluation {
		const implementation = this.implementations.get(localName);

		if (implementation == null) {
			throw new UnknownFunctionError(localName);
		}

		return implementation.call(context, args);
	}

	getImplementation(localName: LocalName): FunctionImplementation<number> | null {
		const implementation = this.implementations.get(localName);

		return implementation ?? null;
	}
}
