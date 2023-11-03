import { Match, Switch } from 'solid-js';
import { Box } from 'suid/material';
import type { XFormEntry } from '../../lib/xform/XFormEntry.ts';
import type { XFormViewChild, XFormViewChildType } from '../../lib/xform/XFormViewChild.ts';
import { XFormInputControl, xFormInputControlProps } from './controls/XFormInputControl.tsx';
import { XFormUnknownControl } from './debugging/XFormUnknownControl.tsx';

export interface XFormControlProps<Type extends XFormViewChildType> {
	readonly entry: XFormEntry;
	readonly viewControl: XFormViewChild & { readonly type: Type };
}

export const XFormControl = (props: XFormControlProps<XFormViewChildType>) => {
	return (
		<Box>
			<Switch fallback={<XFormUnknownControl {...props} />}>
				<Match when={xFormInputControlProps(props)} keyed={true}>
					{(inputControlProps) => <XFormInputControl {...inputControlProps} />}
				</Match>
			</Switch>
		</Box>
	);
};
