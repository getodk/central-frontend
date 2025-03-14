import type { UnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import type { Primitive } from '@getodk/common/types/Primitive.ts';
import type { FormResource } from '../client/form/FormResource.ts';

// prettier-ignore
type PartiallyKnownType<T> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| T
	| UnknownObject
	| Primitive;

/**
 * A {@link Blob}, which _may be_ a {@link File}.
 *
 * Extends {@link Blob} with optional properties corresponding to {@link File}'s
 * own extensions of the same interface, allowing inspection without an
 * unnecessary type cast, and without unnecessary runtime/type reconciliation.
 *
 * @todo There's almost certainly no reason that this couldn't be a part of the
 * client-facing {@link FormResource} union type. It's kept internal here for
 * now, in case that could cause confusion in client integrations.
 */
interface MaybeFile extends Blob {
	readonly lastModified?: PartiallyKnownType<number>;
	readonly name?: PartiallyKnownType<string>;
	readonly webkitRelativePath?: PartiallyKnownType<string>;
}

const blobDescription = (resource: MaybeFile): string => {
	const { name } = resource;

	if (typeof name === 'string') {
		return name;
	}

	let commonConstructorName: 'Blob' | 'File';

	if (resource instanceof File) {
		commonConstructorName = 'File';
	} else {
		commonConstructorName = 'Blob';
	}

	return `Unknown ${commonConstructorName} data`;
};

interface FormResourceMetadata {
	readonly description: string;
	readonly rawData: string | null;
}

const formResourceMetadata = (resource: FormResource): FormResourceMetadata => {
	if (resource instanceof Blob) {
		return {
			description: blobDescription(resource),
			rawData: null,
		};
	}

	if (resource instanceof URL) {
		return {
			description: resource.href,
			rawData: null,
		};
	}

	return {
		description: 'Raw string data',
		rawData: resource,
	};
};

/**
 * @todo This is a placeholder class, given a name so it can be referenced in
 * client interfaces for form loading. It is pending design of errors (broadly)
 * and modeling of form loading errors (specifically).
 */
export class LoadFormFailureError extends AggregateError {
	constructor(resource: FormResource, errors: readonly Error[]) {
		const { description, rawData } = formResourceMetadata(resource);
		const messageLines: string[] = [
			`Failed to load form resource: ${description}`,
			'\n',

			...errors.map((error) => {
				const aggregatedMessage = error.message;

				if (aggregatedMessage == null) {
					return '- Unknown error';
				}

				return `- ${aggregatedMessage}`;
			}),
		];

		if (rawData != null) {
			messageLines.push('\n- - -\n', 'Raw resource data:', rawData);
		}

		const message = messageLines.join('\n');

		super(errors, message);

		const [head, ...tail] = errors;

		if (head != null && tail.length === 0) {
			const { stack } = head;

			if (typeof stack === 'string') {
				this.stack = stack;
			}
		}
	}
}
