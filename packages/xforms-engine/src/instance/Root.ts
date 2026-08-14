import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { FormNodeID, PageBoundary } from '../client/identity.ts';
import type { RootNode } from '../client/RootNode.ts';
import type { InstancePayload } from '../client/serialization/InstancePayload.ts';
import type {
  InstancePayloadOptions,
  InstancePayloadType,
} from '../client/serialization/InstancePayloadOptions.ts';
import type { InstanceState } from '../client/serialization/InstanceState.ts';
import type { AncestorNodeValidationState } from '../client/validation.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { createRootInstanceState } from '../lib/client-reactivity/instance-state/createRootInstanceState.ts';
import {
  type AttributeState,
  createAttributeState,
} from '../lib/reactivity/createAttributeState.ts';
import { type ChildrenState, createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import {
  materializeCurrentStateChildren,
  type MaterializedChildren,
} from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import {
  createSharedNodeState,
  type SharedNodeState,
} from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createAggregatedViolations } from '../lib/reactivity/validation/createAggregatedViolations.ts';
import type { BodyClassList } from '../parse/body/BodyDefinition.ts';
import type { RootDefinition } from '../parse/model/RootDefinition.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildAttributes } from './buildAttributes.ts';
import { Attribute } from './Attribute.ts';
import { buildChildren } from './children/buildChildren.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSerializableParentNode } from './internal-api/serialization/ClientReactiveSerializableParentNode.ts';
import type { TranslationContext } from './internal-api/TranslationContext.ts';
import { createPageNavigation, type PageNavigation } from './pagination/createPageNavigation.ts';
import type { Page } from './pagination/pageSequence.ts';
import { Pagination } from './pagination/Pagination.ts';
import type { PrimaryInstance } from './PrimaryInstance.ts';

interface RootStateSpec {
  readonly reference: Accessor<string>;
  readonly readonly: Accessor<boolean>;
  readonly relevant: Accessor<boolean>;
  readonly required: Accessor<boolean>;
  readonly label: null;
  readonly hint: null;
  readonly children: Accessor<readonly FormNodeID[]>;
  readonly hasRelevantBodyNodes: Accessor<boolean>;
  readonly attributes: Accessor<readonly Attribute[]>;
  readonly valueOptions: null;
  readonly value: null;

  // Root-specific
  readonly activeLanguage: Accessor<ActiveLanguage>;

  // Pagination
  readonly currentPage: Accessor<PageBoundary | null>;
  readonly hasNextPage: Accessor<boolean>;
  readonly hasPreviousPage: Accessor<boolean>;
}

export class Root
  extends DescendantNode<RootDefinition, RootStateSpec, PrimaryInstance, GeneralChildNode>
  implements
    RootNode,
    XFormsXPathElement,
    EvaluationContext,
    TranslationContext,
    ClientReactiveSerializableParentNode<GeneralChildNode>
{
  private readonly childrenState: ChildrenState<GeneralChildNode>;

  // XFormsXPathElement
  override readonly [XPathNodeKindKey] = 'element';

  // DescendantNode
  protected readonly state: SharedNodeState<RootStateSpec>;
  protected readonly engineState: EngineState<RootStateSpec>;
  readonly attributeState: AttributeState;

  override readonly hasReadonlyAncestor = () => false;
  override readonly isSelfReadonly = () => false;
  override readonly isReadonly = () => false;
  override readonly hasNonRelevantAncestor = () => false;
  override readonly isSelfRelevant = () => true;
  override readonly isRelevant = () => true;
  override readonly isRequired = () => false;

  // RootNode
  readonly nodeType = 'root';
  readonly appearances = null;
  readonly nodeOptions = null;
  readonly classes: BodyClassList;
  readonly isPaginated: boolean;
  readonly currentState: MaterializedChildren<CurrentState<RootStateSpec>, GeneralChildNode>;
  readonly validationState: AncestorNodeValidationState;
  readonly instanceState: InstanceState;
  readonly languages: FormLanguages;
  readonly pagination: Pagination;
  private readonly navigation: PageNavigation;

  readonly getCurrentPage: Accessor<Page | null>;
  readonly getOrderedPages: Accessor<readonly Page[]>;

  constructor(parent: PrimaryInstance) {
    const { definition, instanceNode: instance } = parent;
    const instanceNode = instance.root;
    const { nodeset: reference } = definition;
    const computeReference: Accessor<string> = () => reference;

    super(parent, instanceNode, definition, {
      computeReference,
    });

    this.classes = parent.classes;
    this.isPaginated = parent.classes.pages;
    // Pagination owns every page decision, including "this form has no pages". That is why it is disabled
    // rather than null, so nodes always ask it for their pageBoundary, never decide.
    this.pagination = new Pagination(this.isPaginated);

    const childrenState = createChildrenState<Root, GeneralChildNode>(this);
    this.attributeState = createAttributeState(this.scope);

    this.childrenState = childrenState;
    this.languages = parent.languages;

    this.navigation = createPageNavigation(this);
    this.getCurrentPage = () => this.navigation.getCurrentPage();
    this.getOrderedPages = () => this.navigation.getOrderedPages();

    const state = createSharedNodeState(
      this.scope,
      {
        activeLanguage: parent.getActiveLanguage,
        reference: computeReference,
        label: null,
        hint: null,
        readonly: () => false,
        relevant: () => true,
        required: () => false,
        valueOptions: null,
        value: null,
        children: childrenState.childIds,
        hasRelevantBodyNodes: this.hasRelevantBodyNodes,
        attributes: this.attributeState.getAttributes,
        currentPage: this.navigation.currentPage,
        hasNextPage: this.navigation.hasNextPage,
        hasPreviousPage: this.navigation.hasPreviousPage,
      },
      this.instanceConfig
    );

    this.state = state;
    this.engineState = state.engineState;
    this.currentState = materializeCurrentStateChildren(
      this.scope,
      state.currentState,
      childrenState
    );

    childrenState.setChildren(buildChildren(this));
    this.attributeState.setAttributes(buildAttributes(this));
    this.validationState = createAggregatedViolations(this, this.instanceConfig);
    this.instanceState = createRootInstanceState(this);
    this.navigation.initPagination();
  }

  setCurrentPage(page: PageBoundary): PageBoundary | null {
    return this.navigation.setCurrentPage(page);
  }

  nextPage(): void {
    this.navigation.nextPage();
  }

  previousPage(): void {
    this.navigation.previousPage();
  }

  isPageReachable(page: Page): boolean {
    return this.pagination.countPageMembers(page.nodeId) > 0;
  }

  getChildren(): readonly GeneralChildNode[] {
    return this.childrenState.getChildren();
  }

  override getAttributes(): readonly Attribute[] {
    return this.attributeState.getAttributes();
  }

  // RootNode
  setLanguage(language: FormLanguage): Root {
    this.rootDocument.setLanguage(language);

    return this;
  }

  prepareInstancePayload<PayloadType extends InstancePayloadType = 'monolithic'>(
    options?: InstancePayloadOptions<PayloadType>
  ): Promise<InstancePayload<PayloadType>> {
    return this.rootDocument.prepareInstancePayload(options);
  }
}
