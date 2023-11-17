import { Match, Switch, createMemo } from 'solid-js';
import type { XFormEntry } from '../../lib/xform/XFormEntry.ts';
import type { XFormViewChild, XFormViewChildType } from '../../lib/xform/XFormViewChild.ts';
import { XFormRelevanceGuard } from './XFormRelevanceGuard.tsx';
import { XFormGroup, xFormGroupProps } from './containers/XFormGroup.tsx';
import { XFormInputControl, xFormInputControlProps } from './controls/XFormInputControl.tsx';
import { XFormUnknownControl } from './debugging/XFormUnknownControl.tsx';

export interface XFormControlProps<Type extends XFormViewChildType> {
	readonly entry: XFormEntry;
	readonly viewControl: XFormViewChild & { readonly type: Type };
}

export const XFormControl = (props: XFormControlProps<XFormViewChildType>) => {
	const isRelevant = createMemo(() => {
		const ref = props.viewControl.ref;
		const binding = ref == null ? null : props.entry.getBinding(ref);

		return binding?.isRelevant() ?? true;
	});

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<Switch fallback={<XFormUnknownControl {...props} />}>
				<Match when={xFormGroupProps(props)} keyed={true}>
					{(groupProps) => <XFormGroup {...groupProps} />}
				</Match>
				<Match when={xFormInputControlProps(props)} keyed={true}>
					{(inputControlProps) => <XFormInputControl {...inputControlProps} />}
				</Match>
			</Switch>
		</XFormRelevanceGuard>
	);
};
