import type {
	WHATAttribute,
	WHATChildNode,
	WHATComment,
	WHATDocument,
	WHATElement,
	WHATNamespaceDeclaration,
	WHATNode,
	WHATParentNode,
	WHATProcessingInstruction,
	WHATText,
} from './WHAT/WHATNode.ts';
import type { WHATDOMAdapter } from './WHAT/whatDOMAdapter.ts';
import { whatDOMAdapter } from './WHAT/whatDOMAdapter.ts';
import type { XPathDOMProvider } from './xpathDOMProvider.ts';
import { xpathDOMProvider } from './xpathDOMProvider.ts';

/**
 * Truly silly type hack so that TypeScript doesn't unwrap the names of Default*
 * types to their WHAT* equivalent. This is for clarity at usage and reference
 * sites, internally but especially at the package boundary.
 */
type AsDefault<T> = T | (T & { readonly _?: never });

type DefaultDOMAdapter = AsDefault<WHATDOMAdapter>;

type DefaultDOMProvider = AsDefault<XPathDOMProvider<WHATNode>>;

export const DEFAULT_DOM_ADAPTER: DefaultDOMAdapter = whatDOMAdapter;
export const DEFAULT_DOM_PROVIDER: DefaultDOMProvider = xpathDOMProvider(DEFAULT_DOM_ADAPTER);

export type DefaultDOMAdapterDocument = AsDefault<WHATDocument>;
export type DefaultDOMAdapterElement = AsDefault<WHATElement>;
export type DefaultDOMAdapterNamespaceDeclaration = AsDefault<WHATNamespaceDeclaration>;
export type DefaultDOMAdapterAttr = AsDefault<WHATAttribute>;
export type DefaultDOMAdapterText = AsDefault<WHATText>;
export type DefaultDOMAdapterComment = AsDefault<WHATComment>;
export type DefaultDOMAdapterProcessingInstruction = AsDefault<WHATProcessingInstruction>;
export type DefaultDOMAdapterNode = AsDefault<WHATNode>;
export type DefaultDOMAdapterParentNode = AsDefault<WHATParentNode>;
export type DefaultDOMAdapterChildNode = AsDefault<WHATChildNode>;
