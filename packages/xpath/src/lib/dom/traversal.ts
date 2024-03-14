import { assertParentNode } from './assertions.ts';
import { isAttributeNode, isDocumentNode, isElementNode } from './predicates.ts';
import type { ContextDocument, ContextNode, ContextParentNode } from './types.ts';

export const getDocument = (node: Node): Document =>
	node.nodeType === Node.DOCUMENT_NODE ? (node as Document) : node.ownerDocument!;

export const getRootNode = (node: ContextNode): ContextParentNode => {
	if (isDocumentNode(node)) {
		return node;
	}

	if (isElementNode(node)) {
		const rootNode = node.getRootNode();

		assertParentNode(rootNode);

		return rootNode;
	}

	if (isAttributeNode(node)) {
		const { ownerElement } = node;

		if (ownerElement == null) {
			throw 'todo';
		}

		return getRootNode(ownerElement);
	}

	// Comment, ProcessingInstruction, Text
	const { parentElement } = node;

	if (parentElement == null) {
		throw 'todo getRootNode COMMENT | PROCESSING_INSTRUCTION | TEXT';
	}

	return getRootNode(parentElement);
};

const {
	SHOW_ELEMENT,
	SHOW_ATTRIBUTE,
	SHOW_TEXT,
	SHOW_CDATA_SECTION,
	SHOW_PROCESSING_INSTRUCTION,
	SHOW_COMMENT,
	SHOW_DOCUMENT,
	SHOW_DOCUMENT_TYPE,
} = NodeFilter;

const SHOW_ANY = (0 |
	SHOW_ELEMENT |
	SHOW_ATTRIBUTE |
	SHOW_TEXT |
	SHOW_CDATA_SECTION |
	SHOW_PROCESSING_INSTRUCTION |
	SHOW_COMMENT |
	SHOW_DOCUMENT |
	SHOW_DOCUMENT_TYPE) as 975;

const SHOW_ANY_TEXT = (0 | SHOW_TEXT | SHOW_CDATA_SECTION) as 12;

type AnyTreeWalkerFilterFlag =
	| typeof SHOW_ANY
	| typeof SHOW_ANY_TEXT
	| typeof SHOW_ATTRIBUTE
	| typeof SHOW_CDATA_SECTION
	| typeof SHOW_COMMENT
	| typeof SHOW_DOCUMENT
	| typeof SHOW_DOCUMENT_TYPE
	| typeof SHOW_ELEMENT
	| typeof SHOW_PROCESSING_INSTRUCTION
	| typeof SHOW_TEXT;

type TreeWalkerFilterKey = 'ANY' | 'COMMENT' | 'ELEMENT' | 'PROCESSING_INSTRUCTION' | 'TEXT';

export const TreeWalkerFilter = {
	ANY: SHOW_ANY,
	ELEMENT: SHOW_ELEMENT,
	TEXT: SHOW_ANY_TEXT,
	COMMENT: SHOW_COMMENT,
	PROCESSING_INSTRUCTION: SHOW_PROCESSING_INSTRUCTION,
} as const satisfies Record<TreeWalkerFilterKey, AnyTreeWalkerFilterFlag>;

type TreeWalkerFilters = typeof TreeWalkerFilter;

export type TreeWalkerFilter = keyof TreeWalkerFilters;

export type TreeWalkerFilterFlag = TreeWalkerFilters[TreeWalkerFilter];

export type FilteredTreeWalker<Filter extends TreeWalkerFilter = TreeWalkerFilter> = TreeWalker & {
	readonly whatToShow: TreeWalkerFilters[Filter];
};

export const getTreeWalker = <Filter extends TreeWalkerFilter = 'ANY'>(
	contextDocument: ContextDocument,
	contextNode: ContextNode = contextDocument,
	filter: Filter = 'ANY' as Filter
): FilteredTreeWalker<Filter> => {
	const flag = TreeWalkerFilter[filter];

	return contextDocument.createTreeWalker(contextNode, flag) as FilteredTreeWalker<Filter>;
};

export type FilteredTreeWalkers = {
	readonly [Filter in TreeWalkerFilter]: FilteredTreeWalker<Filter>;
};
