import { FunctionImplementation } from './FunctionImplementation.ts';

export class FunctionAlias<Length extends number> extends FunctionImplementation<Length> {
	constructor(localName: string, baseImplementation: FunctionImplementation<Length>) {
		super(localName, baseImplementation.signature, baseImplementation);
	}
}
