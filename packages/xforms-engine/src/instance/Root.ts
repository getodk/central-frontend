import { XPathNodeKindKey } from '@getodk/xpath';
import {
  type Accessor,
  createComputed,
  createMemo,
  createSignal,
  type Setter,
  untrack,
} from 'solid-js';
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
import {
  collectPages,
  MOVE_BACKWARD,
  MOVE_FORWARD,
  nearestReachablePage,
  type NavigationDirection,
  type Page,
  scanForReachable,
} from './pagination/pageSequence.ts';
import { PaginationRegistry } from './pagination/PaginationRegistry.ts';
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
  readonly canGoNext: Accessor<boolean>;
  readonly canGoPrevious: Accessor<boolean>;
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
  readonly currentState: MaterializedChildren<CurrentState<RootStateSpec>, GeneralChildNode>;
  readonly validationState: AncestorNodeValidationState;
  readonly instanceState: InstanceState;
  readonly languages: FormLanguages;
  readonly paginationRegistry: PaginationRegistry;

  readonly getCurrentPage: Accessor<Page | null>;
  private readonly setPage: Setter<Page | null>;
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
    this.paginationRegistry = new PaginationRegistry(parent.classes.pages);

    const childrenState = createChildrenState<Root, GeneralChildNode>(this);
    this.attributeState = createAttributeState(this.scope);

    this.childrenState = childrenState;
    this.languages = parent.languages;

    const [getCurrentPage, setCurrentPage] = createSignal<Page | null>(null);
    this.getCurrentPage = getCurrentPage;
    this.setPage = setCurrentPage;
    const currentPage: Accessor<PageBoundary | null> = () => getCurrentPage()?.nodeId ?? null;

    this.getOrderedPages = this.scope.runTask(() => {
      return createMemo(() =>
        this.paginationRegistry.enabled ? collectPages(this.getChildren()) : []
      );
    });
    const canGoNext = this.scope.runTask(() => {
      return createMemo(() => this.findReachablePage(getCurrentPage(), MOVE_FORWARD) != null);
    });
    const canGoPrevious = this.scope.runTask(() => {
      return createMemo(() => this.findReachablePage(getCurrentPage(), MOVE_BACKWARD) != null);
    });

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
        currentPage,
        canGoNext,
        canGoPrevious,
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
    this.initPagination();
  }

  setCurrentPage(page: PageBoundary): PageBoundary | null {
    const resolved = untrack(() => {
      return this.getOrderedPages().find((candidate) => candidate.nodeId === page);
    });
    if (resolved == null) {
      return null;
    }
    this.setPage(resolved);
    return resolved.nodeId;
  }

  private turnPage(direction: NavigationDirection): void {
    const target = untrack(() => this.findReachablePage(this.getCurrentPage(), direction));
    if (target != null) {
      this.setPage(target);
    }
  }

  nextPage(): void {
    this.turnPage(MOVE_FORWARD);
  }

  previousPage(): void {
    this.turnPage(MOVE_BACKWARD);
  }

  isPageReachable(page: Page): boolean {
    return this.paginationRegistry.countPageMembers(page.nodeId) > 0;
  }

  private findReachablePage(from: Page | null, direction: NavigationDirection): Page | null {
    const NO_POSITION = -1;
    const pages = this.getOrderedPages();
    const startIdx = from == null ? NO_POSITION : pages.findIndex((p) => p.nodeId === from.nodeId);
    if (from != null && startIdx === NO_POSITION) {
      return null;
    }

    return scanForReachable(
      pages,
      startIdx + direction,
      direction,
      (page) => this.isPageReachable(page)
    );
  }

  /**
   * The currentPage points to a reachable page if available; otherwise, it moves to the nearest reachable page.
   * Reads are tracked on purpose; untracking any of them would stop the rule being re-checked.
   */
  private initPagination(): void {
    if (!this.paginationRegistry.enabled) {
      return;
    }

    this.scope.runTask(() => {
      createComputed(() => {
        const current = this.getCurrentPage();
        const pages = this.getOrderedPages();

        if (current == null) {
          const initial = pages.find((page) => this.isPageReachable(page));
          if (initial != null) {
            this.setPage(initial);
          }
          return;
        }

        const stillListed = pages.some((page) => page.nodeId === current.nodeId);
        if (stillListed && this.isPageReachable(current)) {
          return;
        }

        if (!stillListed) {
          const recovered = nearestReachablePage(
            this.getChildren(),
            current,
            (page) => this.isPageReachable(page)
          );
          if (recovered != null) {
            this.setPage(recovered);
          }
          return;
        }

        const neighbour =
          this.findReachablePage(current, MOVE_FORWARD) ??
          this.findReachablePage(current, MOVE_BACKWARD);
        if (neighbour != null) {
          this.setPage(neighbour);
        }
      });
    });
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
