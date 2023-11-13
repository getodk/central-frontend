import { For, createMemo } from 'solid-js';
import { Stack } from 'suid/material';
import type { XFormViewChildType } from '../../../lib/xform/XFormViewChild.ts';
import type { XFormControlProps } from '../XFormControl.tsx';
import { XFormRepeatInstance } from './XFormRepeatInstance.tsx';

export type XFormRepeatListProps = XFormControlProps<'repeat'>;

const isXFormRepeatListProps = (
	props: XFormControlProps<XFormViewChildType>
): props is XFormRepeatListProps => props.viewControl.type === 'repeat';

export const xFormRepeatListProps = (
	props: XFormControlProps<XFormViewChildType>
): XFormRepeatListProps | null => {
	if (isXFormRepeatListProps(props)) {
		return props;
	}

	return null;
};

export const XFormRepeatList = (props: XFormRepeatListProps) => {
	const repeatInstanceBindings = createMemo(() => {
		const singleBindingTemp = props.entry.getViewBinding(props.viewControl);

		if (singleBindingTemp == null) {
			return [];
		}

		return [singleBindingTemp];
	});

	return (
		<Stack spacing={2}>
			<For each={repeatInstanceBindings()}>
				{(binding) => {
					return (
						<XFormRepeatInstance
							binding={binding}
							entry={props.entry}
							viewControl={props.viewControl}
						/>
					);
				}}
			</For>
		</Stack>
	);
};
