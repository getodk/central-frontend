import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { DOMSecondaryInstanceElement } from '../../../XFormDOM.ts';
import { defineSecondaryInstance } from '../defineSecondaryInstance.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';
import { SecondaryInstanceSource } from './SecondaryInstanceSource.ts';

export class BlankSecondaryInstanceSource extends SecondaryInstanceSource<'blank'> {
	constructor(
		instanceId: string,
		resourceURL: JRResourceURL,
		domElement: DOMSecondaryInstanceElement
	) {
		super('blank', instanceId, resourceURL, domElement);
	}

	parseDefinition(): SecondaryInstanceDefinition {
		return defineSecondaryInstance(this.instanceId, '');
	}
}
