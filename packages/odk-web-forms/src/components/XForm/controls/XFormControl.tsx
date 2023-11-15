import { Match, Switch, createMemo } from 'solid-js';
import type { XFormEntry } from '../../../lib/xform/XFormEntry.ts';
import type { ControlDefinition } from '../../../lib/xform/body/control/ControlDefinition.ts';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
import { XFormInputControl, inputControlProps } from './XFormInputControl.tsx';

export interface XFormControlProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly control: ControlDefinition<any>;
	readonly entry: XFormEntry;
}

export const XFormControl = (props: XFormControlProps) => {
	const isRelevant = createMemo(() => {
		return props.control.getBinding(props.entry)?.isRelevant() ?? true;
	});

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<Switch fallback={<XFormUnknownControl {...props} />}>
				<Match when={inputControlProps(props)} keyed={true}>
					<XFormInputControl entry={props.entry} control={props.control} />
				</Match>
			</Switch>
		</XFormRelevanceGuard>
	);
};
