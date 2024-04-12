// TODO: this is literally copied verbatim from XFormGroupLabel.tsx with each
// `Group` changed to `RepeatInstance`. From a view perspective, it seems
// *highly likely* "repeat instance" and "group" are a mostly a shared concern
// with some style variation. In fact, it's probably going to be the case that
// they both turn out to have a very similar view-level data model *and* wrap
// the same view logic in a styled container.

import ExpandLess from '@suid/icons-material/ExpandLess';
import ExpandMore from '@suid/icons-material/ExpandMore';
import { Stack, styled } from '@suid/material';
import { Match, Switch } from 'solid-js';
import { PlainTextButton } from '../../styled/PlainTextButton.tsx';
import { XFormLabel, type XFormLabelProps } from '../XFormLabel.tsx';

const RepeatInstanceLabelStack = styled(Stack)(({ theme }) => ({
	alignItems: '1rem',
	flexDirection: 'row',
	gap: theme.spacing(0.5),
}));

const ClippedRepeatInstanceToggleIconContainer = styled('div')(({ theme }) => ({
	alignSelf: '1rem',
	flexShrink: 0,
	overflow: 'hidden',

	'& > *': {
		marginInlineStart: theme.spacing(-0.5),
	},
}));

interface XFormRepeatInstanceLabelProps extends XFormLabelProps {
	readonly isRepeatInstanceVisible: boolean;
	readonly setRepeatInstanceVisible: (isVisible: boolean) => void;
}

export const XFormRepeatInstanceLabel = (props: XFormRepeatInstanceLabelProps) => {
	return (
		<PlainTextButton
			disabled={!props.node.currentState.relevant}
			onClick={() => {
				if (props.node.currentState.relevant) {
					props.setRepeatInstanceVisible(!props.isRepeatInstanceVisible);
				}
			}}
		>
			<RepeatInstanceLabelStack>
				<ClippedRepeatInstanceToggleIconContainer>
					<Switch>
						<Match when={props.isRepeatInstanceVisible}>
							<ExpandMore fontSize="large" />
						</Match>
						<Match when={!props.isRepeatInstanceVisible}>
							<ExpandLess fontSize="large" />
						</Match>
					</Switch>
				</ClippedRepeatInstanceToggleIconContainer>

				<XFormLabel as="span" node={props.node} label={props.label} />
			</RepeatInstanceLabelStack>
		</PlainTextButton>
	);
};
