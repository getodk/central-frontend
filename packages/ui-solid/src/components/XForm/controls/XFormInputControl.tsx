import type { StringNode } from '@getodk/xforms-engine';
import { Show } from 'solid-js';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';

export interface XFormInputControlProps {
	/**
	 * @todo This should be a `StringInputNode`, whose type should be defined and
	 * exported in the engine's client interface.
	 */
	readonly node: StringNode;
}

export const XFormInputControl = (props: XFormInputControlProps) => {
	return (
		<>
			<Show when={props.node.currentState.label == null}>
				<XFormUnlabeledControl node={props.node} />
			</Show>
			<TextWidget node={props.node} />
		</>
	);
};
