import type { XPathDocument } from '@getodk/xpath';
import { XPathNodeKindKey } from '@getodk/xpath';
import { EngineXPathEvaluator } from '../integration/xpath/EngineXPathEvaluator.ts';
import type { ReactiveScope } from '../lib/reactivity/scope.ts';
import type { ModelDefinition } from '../parse/model/ModelDefinition.ts';
import type { RootDefinition } from '../parse/model/RootDefinition.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';
import { Root } from './Root.ts';

export class PrimaryInstance implements XPathDocument {
	// XPathDocument
	readonly [XPathNodeKindKey] = 'document';

	readonly engineConfig: InstanceConfig;
	readonly definition: RootDefinition;
	readonly evaluator: EngineXPathEvaluator;
	readonly root: Root;
	readonly contextNode: Document;

	constructor(
		readonly scope: ReactiveScope,
		model: ModelDefinition,
		engineConfig: InstanceConfig
	) {
		const { root: definition, form } = model;
		const { xformDOM } = form;
		const { namespaceURI, nodeName } = xformDOM.primaryInstanceRoot;
		const rootNode: Document = xformDOM.xformDocument.implementation.createDocument(
			namespaceURI,
			nodeName
		);

		const evaluator = new EngineXPathEvaluator({
			rootNode,
			itextTranslationsByLanguage: model.itextTranslations,
			secondaryInstancesById: model.secondaryInstances,
		});

		this.definition = definition;
		this.evaluator = evaluator;
		this.engineConfig = engineConfig;
		this.contextNode = rootNode;
		this.root = new Root(this);
	}
}
