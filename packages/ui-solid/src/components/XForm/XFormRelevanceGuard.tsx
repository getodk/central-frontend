import { Box, styled } from '@suid/material';
import type { JSX } from 'solid-js';
import { Show } from 'solid-js';

interface XFormRelevanceGuardProps {
	readonly debug?: boolean;
	readonly isRelevant: boolean;
	readonly children: JSX.Element;
}

const BaseXFormRelevanceGuardBox = (props: XFormRelevanceGuardProps) => <Box>{props.children}</Box>;

const XFormRelevanceGuardBox = styled<typeof BaseXFormRelevanceGuardBox>(Box)(({
	props,
	theme,
}) => {
	if (props.isRelevant) {
		return {};
	}

	if (props.debug) {
		return theme.nonRelevant.debug;
	}

	return theme.nonRelevant.default;
});

export const XFormRelevanceGuard = (props: XFormRelevanceGuardProps) => {
	const debug = () => props.debug ?? false;

	return (
		<Show when={props.isRelevant || debug()}>
			<XFormRelevanceGuardBox debug={debug()} isRelevant={props.isRelevant}>
				{props.children}
			</XFormRelevanceGuardBox>
		</Show>
	);
};
