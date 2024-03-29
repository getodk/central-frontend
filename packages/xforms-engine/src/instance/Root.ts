import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { XFormDOM } from '../XFormDOM.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { RootNode } from '../client/RootNode.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode } from './hierarchy.ts';
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

	// TODO: map children by `nodeId`
	readonly children: Signal<readonly GeneralChildNode[]>;

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
	extends InstanceNode<RootDefinition, RootStateSpec>
	implements
		RootNode,
		EvaluationContext,
		EvaluationContextRoot,
		SubscribableDependency,
		TranslationContext
{
	protected readonly state: SharedNodeState<RootStateSpec>;
	protected readonly engineState: EngineState<RootStateSpec>;

	readonly currentState: CurrentState<RootStateSpec>;

	protected readonly instanceDOM: XFormDOM;

	// BaseNode
	readonly root = this;

	// EvaluationContext
	readonly evaluator: XFormsXPathEvaluator;
	readonly contextNode: Element;

	// RootNode
	readonly parent = null;

	readonly languages: FormLanguages;

	// TranslationContext
	get activeLanguage(): ActiveLanguage {
		return this.engineState.activeLanguage;
	}

	constructor(form: XFormDefinition, engineConfig: InstanceConfig) {
		const definition = form.model.root;

		super(engineConfig, definition);

		const reference = definition.nodeset;
		const instanceDOM = form.xformDOM.createInstance();
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
				children: createSignal<readonly GeneralChildNode[]>([]),
			},
			{
				clientStateFactory: engineConfig.stateFactory,
			}
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.currentState;

		const contextNode = instanceDOM.xformDocument.createElement(definition.nodeName);

		instanceDOM.primaryInstanceRoot.replaceWith(contextNode);

		this.evaluator = evaluator;
		this.contextNode = contextNode;
		this.instanceDOM = instanceDOM;
		this.languages = languages;

		state.setProperty('children', buildChildren(this));
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

	// EvaluationContext
	getSubscribableDependencyByReference(_reference: string): SubscribableDependency | null {
		throw new Error('Not implemented');
	}

	// SubscribableDependency
	subscribe(): void {
		// Presently, the only reactive (and thus subscribable) aspect of the root
		// node is the active form language.
		this.engineState.activeLanguage;
	}
}
