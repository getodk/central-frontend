import { ControlDefinition } from './ControlDefinition.ts';

export class InputDefinition extends ControlDefinition<'input'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'input';
	}

	readonly type = 'input';
}
