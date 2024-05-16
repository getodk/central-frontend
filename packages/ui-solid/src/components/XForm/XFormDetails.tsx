import type { AnyNode, RootNode } from '@getodk/xforms-engine';
import { styled } from '@suid/material';
import { Show, createMemo, createSignal } from 'solid-js';

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

let xmlEscaper: Element | null = null;

const getEscaper = (): Element => {
	xmlEscaper = xmlEscaper ?? document.createElement('esc-aper');

	return xmlEscaper;
};

const escapeXMLText = (value: string) => {
	const escaper = getEscaper();

	escaper.textContent = value;

	const { innerHTML } = escaper;

	escaper.textContent = '';

	return innerHTML;
};

type FakeSerializationInterface = AnyNode & {
	readonly contextNode: {
		readonly textContent: string | null;
	};
};

const indentLine = (depth: number, line: string) => {
	const indentation = ''.padStart(depth, '  ');

	return `${indentation}${line}`;
};

const serializeNode = (node: AnyNode, depth = 0): string => {
	node = node as FakeSerializationInterface;

	const { currentState, definition } = node;
	const { children } = currentState;
	const { nodeName } = definition;

	if (children == null) {
		// Just read it to make it reactive...
		currentState.value;

		const serializedLeafNode = `<${nodeName}>${escapeXMLText((node as FakeSerializationInterface).contextNode.textContent ?? '')}</${nodeName}>`;

		return indentLine(depth, serializedLeafNode);
	}

	return [
		indentLine(depth, `<${nodeName}>`),
		children.map((child) => {
			return serializeNode(child, depth + 1);
		}),
		indentLine(depth, `</${nodeName}>`),
	]
		.flat()
		.join('\n');
};

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
						const submissionState = createMemo(() => {
							return serializeNode(props.root);
						});

						return <Pre>{submissionState()}</Pre>;
					}}
				</Show>
			</Details>
		</>
	);
};
