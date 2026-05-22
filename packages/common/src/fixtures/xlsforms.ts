const buildXlsFormUrlMap = (): Map<string, string> => {
	const xlsFormUrls = import.meta.glob<true, 'url', string>('./**/*.xlsx', {
		query: '?url',
		import: 'default',
		eager: true,
	});

	return Object.entries(xlsFormUrls).reduce((acc, [path, url]) => {
		const formIdentifier = /\/([^/]+)\.[^/]+$/.exec(path);

		if (!formIdentifier || formIdentifier.length < 2 || !formIdentifier[1]) {
			throw new Error('Unable to extract XLSForm filename');
		}

		acc.set(formIdentifier[1], new URL(url, import.meta.url).href);
		return acc;
	}, new Map<string, string>());
};

export const xlsFormUrlMap = buildXlsFormUrlMap();
