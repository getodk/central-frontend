import { Match, Switch } from 'solid-js';
import { Box } from 'suid/material';
import type { XFormViewControl, XFormViewControlType } from '../../lib/xform/types.ts';
import { XFormInputControl, xFormInputControlProps } from './controls/XFormInputControl.tsx';
import { XFormUnknownControl } from './debugging/XFormUnknownControl.tsx';

export interface XFormControlProps<Type extends XFormViewControlType> {
	readonly viewControl: XFormViewControl & { readonly type: Type };
}

export const XFormControl = (props: XFormControlProps<XFormViewControlType>) => {
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
