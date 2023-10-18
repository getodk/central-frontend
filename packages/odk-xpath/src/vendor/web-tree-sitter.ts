import Parser from 'web-tree-sitter';

const WebTreeSitterParser = await (async (): Promise<typeof Parser> => {
	try {
		const webTreeSitter = await import('web-tree-sitter');

		return webTreeSitter.default ?? webTreeSitter;
	} catch (error) {
		console.error('Failed to load web-tree-sitter parser', error);

		throw error;
	}
})();

export { WebTreeSitterParser as Parser };
export type ParserInstance = import('web-tree-sitter');
export type { Language } from 'web-tree-sitter';
