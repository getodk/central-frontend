import { beforeEach, describe, expect, it } from 'vitest';
import { XFormXPathEvaluator } from './XFormXPathEvaluator';

describe('XFormXPathEvaluator (convenience wrapper)', () => {
	const FORM_TITLE = 'Title of form';
	const PRIMARY_INSTANCE_ROOT_ID = 'id-of-root';

	let xformDocument: XMLDocument;
	let evaluator: XFormXPathEvaluator;

	beforeEach(() => {
		const parser = new DOMParser();

		// TODO: test DSL, like JavaRosa
		xformDocument = parser.parseFromString(
			/* xml */ `
			<?xml version="1.0"?>
			<h:html xmlns="http://www.w3.org/2002/xforms"
				xmlns:ev="http://www.w3.org/2001/xml-events"
				xmlns:h="http://www.w3.org/1999/xhtml"
				xmlns:jr="http://openrosa.org/javarosa"
				xmlns:orx="http://openrosa.org/xforms/"
				xmlns:xsd="http://www.w3.org/2001/XMLSchema">
				<h:head>
					<h:title>${FORM_TITLE}</h:title>
					<model>
						<instance>
							<root id="${PRIMARY_INSTANCE_ROOT_ID}">
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
			</h:html>
		`.trim(),
			'text/xml'
		);

		evaluator = new XFormXPathEvaluator(xformDocument);
	});

	it('evaluates a string from the form root', () => {
		const title = evaluator.evaluateString('/h:html/h:head/h:title');

		expect(title).to.equal(FORM_TITLE);
	});
});
