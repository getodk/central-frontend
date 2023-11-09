import type { JSX } from 'solid-js';
import { Stack } from 'suid/material';

interface XFormControlStackProps {
	readonly children: JSX.Element;
}

export const XFormControlStack = (props: XFormControlStackProps) => {
	return (
		<Stack
			// 60px in Figma
			spacing={7.5}
		>
			{props.children}
		</Stack>
	);
};
