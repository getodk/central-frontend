import { describe, expect, it } from 'vitest';
import { escapeXMLText } from '../../src/lib/xml-serialization.ts';

describe('XML serialization', () => {
	describe('escapeXMLText', () => {
		interface TestCase {
			readonly input: string;
			readonly isAttributeValue: boolean;
			readonly expected: string;
		}

		it.each<TestCase>([
			{
				input: '10 < x < 12',
				isAttributeValue: false,
				expected: '10 &lt; x &lt; 12',
			},
			{
				input: 'x < "10" & x > \'12\'',
				isAttributeValue: false,
				expected: 'x &lt; "10" &amp; x &gt; \'12\'',
			},
			{
				input: 'x < "10" & x > \'12\'',
				isAttributeValue: true,
				expected: "x &lt; &quot;10&quot; &amp; x &gt; '12'",
			},
		])(
			'escapes $input to $expected (is attribute value? $isAttributeValue)',
			({ input, isAttributeValue, expected }) => {
				const actual = escapeXMLText(input, isAttributeValue);

				expect(actual).toBe(expected);
			}
		);
	});
});
