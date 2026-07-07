import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { AttributeContext } from '../../instance/internal-api/AttributeContext.ts';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { SimpleAtomicStateSetter } from '../../lib/reactivity/types.ts';
import { parseStaticDocumentFromDOMSubtree } from '../shared/parseStaticDocumentFromDOMSubtree.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ActionDefinition } from './ActionDefinition.ts';
import { ItextTranslationsDefinition } from './ItextTranslationsDefinition.ts';
import { ModelActionMap } from './ModelActionMap.ts';
import { ModelBindMap } from './ModelBindMap.ts';
import type { AnyNodeDefinition } from './NodeDefinition.ts';
import type { NodeDefinitionMap } from './nodeDefinitionMap.ts';
import { nodeDefinitionMap } from './nodeDefinitionMap.ts';
import { RootDefinition } from './RootDefinition.ts';
import { SubmissionDefinition } from './SubmissionDefinition.ts';
import { TranslationDefinitionMap } from './TranslationDefinitionMap.ts';

type XformsRevalidateListener = () => void;
export interface ValueChangedEventListener {
  context: AttributeContext | InstanceValueContext;
  setRelevantValue: SimpleAtomicStateSetter<string>;
  action: ActionDefinition;
  ref: string;
}

export class ModelDefinition {
  readonly binds: ModelBindMap;
  readonly actions: ModelActionMap;
  readonly root: RootDefinition;
  readonly nodes: NodeDefinitionMap;
  readonly instance: StaticDocument;
  readonly itextTranslations: ItextTranslationsDefinition;
  readonly itextElements: Map<string, Map<string, Element>>;
  // Keyed by the node object (not its `ref` string), so each entry can be
  // removed when the node is removed. Otherwise removed repeat instances leak.
  readonly xformsRevalidateListeners: Map<object, XformsRevalidateListener>;
  readonly valueChangedEventListeners: Map<string, ValueChangedEventListener[]>;

  constructor(readonly form: XFormDefinition) {
    const submission = new SubmissionDefinition(form.xformDOM);

    this.binds = ModelBindMap.fromModel(this);
    this.actions = ModelActionMap.fromModel(this);
    this.instance = parseStaticDocumentFromDOMSubtree(form.xformDOM.primaryInstanceRoot, {
      nodesetPrefix: '/',
    });
    this.root = new RootDefinition(form, this, submission, form.body.classes);
    this.nodes = nodeDefinitionMap(this.root);
    this.itextTranslations = ItextTranslationsDefinition.from(form.xformDOM);
    this.itextElements = new TranslationDefinitionMap(form.xformDOM.itextTranslationElements);
    this.xformsRevalidateListeners = new Map();
    this.valueChangedEventListeners = new Map();
  }

  getNodeDefinition(nodeset: string): AnyNodeDefinition {
    const definition = this.nodes.get(nodeset);

    if (definition == null) {
      throw new ErrorProductionDesignPendingError(`No definition for nodeset: ${nodeset}`);
    }

    return definition;
  }

  getRootDefinition(instance: StaticDocument): RootDefinition {
    const definition = this.getNodeDefinition(instance.root.nodeset);

    if (definition !== this.root) {
      throw new ErrorProductionDesignPendingError();
    }

    return definition;
  }

  registerXformsRevalidateListener(owner: object, listener: XformsRevalidateListener) {
    this.xformsRevalidateListeners.set(owner, listener);
  }

  unregisterXformsRevalidateListener(owner: object) {
    this.xformsRevalidateListeners.delete(owner);
  }

  triggerXformsRevalidateListeners() {
    this.xformsRevalidateListeners.forEach((listener: XformsRevalidateListener) => listener());
  }

  getItextElement(activeLanguage: ActiveLanguage, itextId: string): Element | undefined {
    return this.itextElements.get(activeLanguage.language)?.get(itextId);
  }

  toJSON() {
    const { form, ...rest } = this;

    return rest;
  }
}
