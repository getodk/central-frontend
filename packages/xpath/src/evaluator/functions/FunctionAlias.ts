import { FunctionImplementation } from './FunctionImplementation.ts';

export class FunctionAlias extends FunctionImplementation {
	constructor(localName: string, baseImplementation: FunctionImplementation) {
		super(localName, baseImplementation.signature, baseImplementation);
	}
}
