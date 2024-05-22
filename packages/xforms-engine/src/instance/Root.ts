import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { XFormDOM } from '../XFormDOM.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { RootNode } from '../client/RootNode.ts';
import type { ChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { NodeID } from './identity.ts';
import type { EvaluationContext, EvaluationContextRoot } from './internal-api/EvaluationContext.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { TranslationContext } from './internal-api/TranslationContext.ts';

interface RootStateSpec {
	readonly reference: string;
	readonly readonly: boolean;
	readonly relevant: boolean;
	readonly required: boolean;
	readonly label: null;
	readonly hint: null;
	readonly children: Accessor<readonly NodeID[]>;
	readonly valueOptions: null;
	readonly value: null;

	// Root-specific
	readonly activeLanguage: Signal<ActiveLanguage>;
}

// Subset of types expected from evaluator
interface ItextTranslations {
	getActiveLanguage(): string | null;
	getLanguages(): readonly string[];
}

interface InitialLanguageState {
	readonly defaultLanguage: ActiveLanguage;
	readonly languages: FormLanguages;
}

// TODO: it's really very silly that the XPath evaluator is the current
// definitional source of truth for translation stuff... even though it currently makes sense that that's where it's first derived.
const getInitialLanguageState = (translations: ItextTranslations): InitialLanguageState => {
	const activeLanguageName = translations.getActiveLanguage();

	if (activeLanguageName == null) {
		const defaultLanguage: ActiveLanguage = {
			isSyntheticDefault: true,
			language: '',
		};
		const languages = [defaultLanguage] satisfies FormLanguages;

		return {
			defaultLanguage,
			languages,
		};
	}

	const languageNames = translations.getLanguages();

	const inactiveLanguages = languageNames
		.filter((languageName) => {
			return languageName !== activeLanguageName;
		})
		.map((language): FormLanguage => {
			return { language };
		});

	const languages = [
		{ language: activeLanguageName } satisfies FormLanguage,

		...inactiveLanguages,
	] satisfies FormLanguages;
	const [defaultLanguage] = languages;

	return {
		defaultLanguage,
		languages,
	};
};

export class Root
	extends InstanceNode<RootDefinition, RootStateSpec, GeneralChildNode>
	implements
		RootNode,
		EvaluationContext,
		EvaluationContextRoot,
		SubscribableDependency,
		TranslationContext
{
	static async initialize(
		xformDOM: XFormDOM,
		definition: RootDefinition,
		engineConfig: InstanceConfig
	): Promise<Root> {
		const instance = new Root(xformDOM, definition, engineConfig);

		await instance.formStateInitialized();

		return instance;
	}

	private readonly childrenState: ChildrenState<GeneralChildNode>;

	// InstanceNode
	protected readonly state: SharedNodeState<RootStateSpec>;
	protected readonly engineState: EngineState<RootStateSpec>;

	// RootNode
	readonly nodeType = 'root';

	readonly currentState: MaterializedChildren<CurrentState<RootStateSpec>, GeneralChildNode>;

	protected readonly instanceDOM: XFormDOM;

	// BaseNode
	readonly root = this;

	// EvaluationContext
	readonly evaluator: XFormsXPathEvaluator;

	private readonly rootReference: string;

	override get contextReference(): string {
		return this.rootReference;
	}

	readonly contextNode: Element;

	// RootNode
	override readonly parent = null;

	readonly languages: FormLanguages;

	// TranslationContext
	get activeLanguage(): ActiveLanguage {
		return this.engineState.activeLanguage;
	}

	protected constructor(
		xformDOM: XFormDOM,
		definition: RootDefinition,
		engineConfig: InstanceConfig
	) {
		super(engineConfig, null, definition);

		const childrenState = createChildrenState<Root, GeneralChildNode>(this);

		this.childrenState = childrenState;

		const reference = definition.nodeset;

		this.rootReference = reference;

		const instanceDOM = xformDOM.createInstance();
		const evaluator = instanceDOM.primaryInstanceEvaluator;
		const { translations } = evaluator;
		const { defaultLanguage, languages } = getInitialLanguageState(translations);
		const state = createSharedNodeState(
			this.scope,
			{
				activeLanguage: createSignal<ActiveLanguage>(defaultLanguage),
				reference,
				label: null,
				hint: null,
				readonly: false,
				relevant: true,
				required: false,
				valueOptions: null,
				value: null,
				children: childrenState.childIds,
			},
			{
				clientStateFactory: engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(state.currentState, childrenState);

		const contextNode = instanceDOM.xformDocument.createElement(definition.nodeName);

		instanceDOM.primaryInstanceRoot.replaceWith(contextNode);

		this.evaluator = evaluator;
		this.contextNode = contextNode;
		this.instanceDOM = instanceDOM;
		this.languages = languages;

		childrenState.setChildren(buildChildren(this));
	}

	/**
	 * Waits until form state is fully initialized.
	 *
	 * As much as possible, all instance state computations are implemented so
	 * that they complete synchronously.
	 *
	 * There is currently one exception: because instance nodes may form
	 * computation dependencies into their descendants as well as their ancestors,
	 * there is an allowance **during form initialization only** to account for
	 * this chicken/egg scenario. Note that this allowance is intentionally,
	 * strictly limited: if form state initialization is not resolved within a
	 * single microtask tick we throw/reject.
	 *
	 * All subsequent computations are always performed synchronously (and we will
	 * use tests to validate this, by utilizing the synchronously returned `Root`
	 * state from client-facing write interfaces).
	 */
	async formStateInitialized(): Promise<void> {
		await new Promise<void>((resolve) => {
			queueMicrotask(resolve);
		});

		if (!this.isStateInitialized()) {
			throw new Error(
				'Form state initialization failed to complete in a single frame. Has some aspect of reactive computation been made asynchronous by mistake?'
			);
		}
	}

	// InstanceNode
	protected computeReference(_parent: null, definition: RootDefinition): string {
		return definition.nodeset;
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}

	// RootNode
	setLanguage(language: FormLanguage): Root {
		const activeLanguage = this.languages.find((formLanguage) => {
			return formLanguage.language === language.language;
		});

		if (activeLanguage == null) {
			throw new Error(`Language "${language.language}" not available`);
		}

		this.evaluator.translations.setActiveLanguage(activeLanguage.language);
		this.state.setProperty('activeLanguage', activeLanguage);

		return this;
	}

	// SubscribableDependency
	override subscribe(): void {
		super.subscribe();

		this.engineState.activeLanguage;
	}
}
