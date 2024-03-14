import ExpandLess from '@suid/icons-material/ExpandLess';
import ExpandMore from '@suid/icons-material/ExpandMore';
import { Stack, styled } from '@suid/material';
import { Match, Switch } from 'solid-js';
import { PlainTextButton } from '../../styled/PlainTextButton.tsx';
import { XFormLabel, type XFormLabelProps } from '../XFormLabel.tsx';

const GroupLabelStack = styled(Stack)(({ theme }) => ({
	alignItems: '1rem',
	flexDirection: 'row',
	gap: theme.spacing(0.5),
}));

const ClippedGroupToggleIconContainer = styled('div')(({ theme }) => ({
	alignSelf: '1rem',
	flexShrink: 0,
	overflow: 'hidden',

	'& > *': {
		marginInlineStart: theme.spacing(-0.5),
	},
}));

interface XFormGroupLabelProps extends XFormLabelProps {
	readonly isGroupVisible: boolean;
	readonly setGroupVisible: (isVisible: boolean) => void;
}

export const XFormGroupLabel = (props: XFormGroupLabelProps) => {
	return (
		<PlainTextButton
			disabled={!props.state.isRelevant()}
			onClick={() => {
				if (props.state.isRelevant()) {
					props.setGroupVisible(!props.isGroupVisible);
				}
			}}
		>
			<GroupLabelStack>
				<ClippedGroupToggleIconContainer>
					<Switch>
						<Match when={props.isGroupVisible}>
							<ExpandMore fontSize="large" />
						</Match>
						<Match when={!props.isGroupVisible}>
							<ExpandLess fontSize="large" />
						</Match>
					</Switch>
				</ClippedGroupToggleIconContainer>

				<XFormLabel as="span" state={props.state} label={props.label} />
			</GroupLabelStack>
		</PlainTextButton>
	);
};
