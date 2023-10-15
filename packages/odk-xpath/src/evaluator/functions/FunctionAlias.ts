import type { FunctionImplementationOptions } from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export class FunctionAlias<Length extends number> extends FunctionImplementation<Length> {
	constructor(
		baseImplementation: FunctionImplementation<Length>,
		options: FunctionImplementationOptions = {}
	) {
		super(baseImplementation.signature, baseImplementation.call, options);
	}
}
