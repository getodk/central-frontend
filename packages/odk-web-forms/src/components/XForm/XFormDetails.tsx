import { styled } from 'suid/material';
import type { XFormDefinition } from '../../lib/xform/XFormDefinition.ts';
import type { EntryState } from '../../lib/xform/state/EntryState.ts';

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
	readonly definition: XFormDefinition;
	readonly entry: EntryState;
}

export const XFormDetails = (props: XFormDetailsProps) => (
	<>
		<Details>
			<Summary>Submission state (XML)</Summary>
			<Pre>{props.entry.serializedInstanceState()}</Pre>
		</Details>
		<Details>
			<Summary>XFormDefinition</Summary>
			<Pre>{JSON.stringify(props.definition, null, 2)}</Pre>
		</Details>
		<Details>
			<Summary>XForm (XML)</Summary>
			<Pre>{props.definition.xformDocument.documentElement.outerHTML}</Pre>
		</Details>
	</>
);
