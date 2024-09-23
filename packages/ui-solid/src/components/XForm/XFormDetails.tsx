import type { RootNode } from '@getodk/xforms-engine';
import { styled } from '@suid/material';
import { Show, createSignal } from 'solid-js';

const Details = styled('details')({
	position: 'relative',
	borderLeft: '2px solid #009ecc',
	paddingLeft: '1rem',
});

const Summary = styled('summary')({
	cursor: 'pointer',
});

const Pre = styled('pre')({
	position: 'relative',
	overflowX: 'auto',
	background:
		'linear-gradient(to left, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.045) 0.0625rem, rgba(0, 0, 0, 0) 0.5rem)',
	whiteSpace: 'pre-wrap',
});

export interface XFormDetailsProps {
	readonly root: RootNode;
}

export const XFormDetails = (props: XFormDetailsProps) => {
	const [showSubmissionState, setShowSubmissionState] = createSignal(false);

	return (
		<>
			<Details
				onToggle={(event) => {
					setShowSubmissionState(event.currentTarget.open);
				}}
			>
				<Summary>Submission state (XML)</Summary>
				<Show when={showSubmissionState()}>
					{(_) => {
						return <Pre>{props.root.submissionState.submissionXML}</Pre>;
					}}
				</Show>
			</Details>
		</>
	);
};
