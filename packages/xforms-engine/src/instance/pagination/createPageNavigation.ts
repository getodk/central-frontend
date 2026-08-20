import type { Accessor } from 'solid-js';
import { batch, createComputed, createMemo, createSignal, untrack } from 'solid-js';
import type { PageBoundary } from '../../client/identity.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { GeneralChildNode } from '../hierarchy.ts';
import type { NodeNavigation } from '../navigation/createNodeNavigation.ts';
import { findFirstVisibleControl } from '../navigation/findFirstVisibleControl.ts';
import type { Pagination } from './Pagination.ts';
import {
  collectPages,
  findReachablePage,
  MOVE_BACKWARD,
  MOVE_FORWARD,
  type NavigationDirection,
  type Page,
  resolveCurrentPage,
} from './pageSequence.ts';

interface PageNavigationHost {
  readonly scope: ReactiveScope;
  readonly pagination: Pagination;
  getChildren(): readonly GeneralChildNode[];
  isPageReachable(page: Page): boolean;
}

export interface PageNavigation {
  readonly getOrderedPages: Accessor<readonly Page[]>;
  readonly getCurrentPage: Accessor<Page | null>;
  readonly currentPage: Accessor<PageBoundary | null>;
  readonly hasNextPage: Accessor<boolean>;
  readonly hasPreviousPage: Accessor<boolean>;
  setCurrentPage(page: PageBoundary): PageBoundary | null;
  nextPage(): void;
  previousPage(): void;
  initPagination(): void;
}

const DISABLED_PAGE_NAVIGATION: PageNavigation = {
  getOrderedPages: () => [],
  getCurrentPage: () => null,
  currentPage: () => null,
  hasNextPage: () => false,
  hasPreviousPage: () => false,
  setCurrentPage: () => null,
  nextPage: () => undefined,
  previousPage: () => undefined,
  initPagination: () => undefined,
};

export const createPageNavigation = (
  host: PageNavigationHost,
  nodeNavigation: NodeNavigation
): PageNavigation => {
  if (!host.pagination.enabled) {
    return DISABLED_PAGE_NAVIGATION;
  }

  const [getCurrentPage, writePage] = createSignal<Page | null>(null);
  const currentPage: Accessor<PageBoundary | null> = () => getCurrentPage()?.nodeId ?? null;

  const setPage = (page: Page | null): void => {
    // Same-page writes happen on every relevance change; exit if same page.
    const current = untrack(() => getCurrentPage());
    if (page === current) {
      return;
    }

    const target = page == null ? null : (findFirstVisibleControl(page)?.nodeId ?? null);
    batch(() => {
      writePage(page);
      nodeNavigation.setNavigationTarget(target);
    });
  };

  const isReachable = (page: Page): boolean => host.isPageReachable(page);

  const getOrderedPages = host.scope.runTask(() => {
    return createMemo(() => collectPages(host.getChildren()));
  });

  const findFromCurrent = (direction: NavigationDirection): Page | null => {
    return findReachablePage(getOrderedPages(), getCurrentPage(), direction, isReachable);
  };

  const hasNextPage = host.scope.runTask(() => {
    return createMemo(() => findFromCurrent(MOVE_FORWARD) != null);
  });

  const hasPreviousPage = host.scope.runTask(() => {
    return createMemo(() => findFromCurrent(MOVE_BACKWARD) != null);
  });

  const setCurrentPage = (page: PageBoundary): PageBoundary | null => {
    const resolved = untrack(() => {
      return getOrderedPages().find((candidate) => candidate.nodeId === page);
    });

    if (resolved == null) {
      return null;
    }

    setPage(resolved);
    return resolved.nodeId;
  };

  const turnPage = (direction: NavigationDirection): void => {
    const target = untrack(() => findFromCurrent(direction));
    if (target != null) {
      setPage(target);
    }
  };

  const nextPage = (): void => {
    turnPage(MOVE_FORWARD);
  };

  const previousPage = (): void => {
    turnPage(MOVE_BACKWARD);
  };

  /**
   * The currentPage points to a reachable page if available; otherwise, it moves to the nearest reachable page.
   * Reads are tracked on purpose; untracking any of them would stop the previous rule being re-checked.
   */
  const initPagination = (): void => {
    host.scope.runTask(() => {
      createComputed(() => {
        const target = resolveCurrentPage(
          getOrderedPages(),
          getCurrentPage(),
          host.getChildren(),
          isReachable
        );
        setPage(target);
      });
    });
  };

  return {
    getOrderedPages,
    getCurrentPage,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    setCurrentPage,
    nextPage,
    previousPage,
    initPagination,
  };
};
