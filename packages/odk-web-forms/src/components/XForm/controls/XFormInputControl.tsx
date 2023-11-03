import { Show, createMemo } from 'solid-js';
import type { XFormViewChildType } from '../../../lib/xform/XFormViewChild.ts';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import type { XFormControlProps } from '../XFormControl.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';

export type XFormInputControlProps = XFormControlProps<'input'>;

const isXFormInputControlProps = (
	props: XFormControlProps<XFormViewChildType>
): props is XFormInputControlProps => props.viewControl.type === 'input';

export const xFormInputControlProps = (
	props: XFormControlProps<XFormViewChildType>
): XFormInputControlProps | null => {
	if (isXFormInputControlProps(props)) {
		return props;
	}

	return null;
};

export const XFormInputControl = (props: XFormInputControlProps) => {
	// This is non-ideal, but the implications aren't obvious looking at it.
	//
	// In an earlier iteration, accessing the binding was done directly in the
	// TextWidget binding prop value below. For some reason this produced Solid's
	// warning that computations were being created outside of a reactive root.
	// What that suggests is that the computations (and perhaps quite a bit more!)
	// were being recreated on each value change. What **that** suggests is that
	// it's possibly caused by underlying implementation details in SUID's
	// handling of props. (I can't say yet for sure, but here felt like as good a
	// place as any to capture the observation and hypothesis.)
	const binding = createMemo(() => {
		const { ref } = props.viewControl;

		if (ref == null) {
			return null;
		}

		return props.entry.get(ref) ?? null;
	});

	return (
		<>
			<Show when={props.viewControl.label == null}>
				<XFormUnlabeledControl entry={props.entry} viewControl={props.viewControl} />
			</Show>
			<TextWidget label={props.viewControl.label} ref={props.viewControl.ref} binding={binding()} />
		</>
	);
};
