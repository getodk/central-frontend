/* eslint-disable */
// @ts-nocheck

import Mustache from 'mustache';
import fs from 'node:fs/promises';

const rootUrl = new URL('../..', import.meta.url);
const featureMatrix = JSON.parse(
	await fs.readFile(new URL('./feature-matrix.json', rootUrl), 'utf-8')
);
const template = await fs.readFile(
	new URL('scripts/feature-matrix/template.mustache', rootUrl),
	'utf-8'
);
const readmeFile = await fs.readFile(new URL('./README.md', rootUrl), 'utf-8');

// Modified version of https://gist.github.com/rougier/c0d31f5cbdaac27b876c?permalink_comment_id=2269298#gistcomment-2269298
const progress = ({ value, length = 20 }) => {
	const v = (value / 100) * length;
	const x = v < 1 ? 1 : Math.floor(v);
	const bar = Array(x).fill('█').join('');
	const remaining = Array(length - bar.length)
		.fill('█')
		.join('');
	return `\\color{green}${bar}\\color{LightGray}${remaining} \\space \\color{initial} ${value}\\%`;
};

// Not so smart, blindly breaks the word. Okay for now.
const wrapString = (str, maxLength) => {
	let parts = [];
	for (let i = 0; i < str.length; i += maxLength) {
		parts.push(str.slice(i, i + maxLength));
	}
	return parts.join('<br/>');
};

// Transform feature-matrix.json object into array
const featureCategories = Object.keys(featureMatrix).map((featureCategory) => {
	const features = Object.keys(featureMatrix[featureCategory]).map((feature) => {
		return {
			label: wrapString(feature.replaceAll('|', '\\|'), 40),
			status: featureMatrix[featureCategory][feature],
		};
	});

	// no points for 🚧
	const progressPercentage = Math.floor(
		(features.filter((f) => f.status === '✅').length / features.length) * 100
	);

	// hack: Space character in Latex monospace font is not same size as other characters.
	//       Using '=' sign with transparent color for padding. 🙃
	let label = `${featureCategory}`.padEnd(40, '=').replaceAll(' ', ' \\space \\space ');
	label = label.replace('=', '\\color{transparent}=');

	const progressOutput = progress({ value: progressPercentage });

	return {
		// Using Latex for <summary> of collapsible - this allows using colored text in MD.
		// mathtt is for monospace.
		label: '${\\mathtt{' + label + ' ' + progressOutput + '}}$',
		features,
	};
});

const featureMatrixMd = Mustache.render(template, { categories: featureCategories });

const autogenOpen = '<!-- autogen: feature-matrix -->';
const autogenClose = '<!-- /autogen: feature-matrix -->';

const regex = new RegExp(`(${autogenOpen})[\\s\\S]*?(${autogenClose})`, 'm');

const updatedReadme = readmeFile.replace(regex, `$1\n${featureMatrixMd}\n$2`);

await fs.writeFile(new URL('./README.md', rootUrl), updatedReadme, { encoding: 'utf-8' });
