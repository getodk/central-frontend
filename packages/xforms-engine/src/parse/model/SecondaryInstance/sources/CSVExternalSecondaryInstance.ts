import type { StaticElementOptions } from '../../../../integration/xpath/static-dom/StaticElement.ts';
import { defineSecondaryInstance } from '../defineSecondaryInstance.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';
import { parseItems } from './external-instance-csv-parser.ts';
import { ExternalSecondaryInstanceSource } from './ExternalSecondaryInstanceSource.ts';

interface CSVExternalSecondaryInstanceItemColumn {
	readonly columnName: string;
	readonly cellValue: string;
}

type CSVExternalSecondaryInstanceItem = readonly CSVExternalSecondaryInstanceItemColumn[];

const columnChildOption = (
	column: CSVExternalSecondaryInstanceItemColumn
): StaticElementOptions => {
	const { columnName, cellValue } = column;

	return {
		name: columnName,
		children: [cellValue],
	};
};

const itemChildOption = (item: CSVExternalSecondaryInstanceItem): StaticElementOptions => {
	return {
		name: 'item',
		children: item.map(columnChildOption),
	};
};

const rootChildOption = (
	items: readonly CSVExternalSecondaryInstanceItem[]
): StaticElementOptions => {
	return {
		name: 'root',
		children: items.map(itemChildOption),
	};
};

const csvExternalSecondaryInstanceDefinition = (
	instanceId: string,
	items: readonly CSVExternalSecondaryInstanceItem[]
): SecondaryInstanceDefinition => {
	return defineSecondaryInstance(instanceId, rootChildOption(items));
};

export class CSVExternalSecondaryInstanceSource extends ExternalSecondaryInstanceSource<'csv'> {
	parseDefinition(): SecondaryInstanceDefinition {
		const items = parseItems(this.resourceURL, this.resource.data);
		return csvExternalSecondaryInstanceDefinition(this.instanceId, items);
	}
}
