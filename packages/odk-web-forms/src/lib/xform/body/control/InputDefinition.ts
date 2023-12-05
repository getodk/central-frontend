import { ControlDefinition } from './ControlDefinition.ts';

export class InputDefinition extends ControlDefinition<'input'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'input';
	}

	override readonly category = 'control';
	readonly type = 'input';
}
