import { render } from '@solidjs/testing-library';
import { beforeEach, describe, expect, it } from 'vitest';
import { parseXForm } from '../../lib/xform/parse.ts';
import type { XFormDefinition } from '../../lib/xform/types.ts';
import { XFormView } from './XFormView.tsx';

describe('XFormView', () => {
	// TODO: DSL, like JavaRosa
	const xform = /* xml */ `<?xml version="1.0"?>
	<h:html xmlns="http://www.w3.org/2002/xforms"
		xmlns:ev="http://www.w3.org/2001/xml-events"
		xmlns:h="http://www.w3.org/1999/xhtml"
		xmlns:jr="http://openrosa.org/javarosa"
		xmlns:orx="http://openrosa.org/xforms/"
		xmlns:xsd="http://www.w3.org/2001/XMLSchema">
		<h:head>
			<h:title>Minimal XForm</h:title>
			<model>
				<instance>
					<root id="minimal">
						<first-question/>
						<second-question/>
						<meta>
							<instanceID/>
						</meta>
					</root>
				</instance>
				<bind nodeset="/root/first-question" type="string"/>
				<bind nodeset="/root/second-question" type="string"/>
				<bind nodeset="/root/meta/instanceID" type="string"/>
			</model>
		</h:head>
		<h:body>
			<input ref="/root/first-question">
				<label>First question</label>
			</input>
			<input ref="/root/second-question"></input>
			<unknown-control ref="/root/second-question"></unknown-control>
		</h:body>
	</h:html>`;

	let xformDefinition: XFormDefinition;

	beforeEach(() => {
		xformDefinition = parseXForm(xform);
	});

	it('renders the form title', () => {
		const rendered = render(() => <XFormView definition={xformDefinition} />);

		expect(rendered.getByText('Minimal XForm')).toBeInTheDocument();
	});

	it('renders the first question', () => {
		const rendered = render(() => <XFormView definition={xformDefinition} />);

		expect(rendered.getByText('First question')).toBeInTheDocument();
	});
});
