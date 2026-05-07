import type { Ref } from 'vue';

interface XlsOnlineResponse {
	error?: string;
	warnings?: string[];
	xform_url?: string;
	itemsets_url?: string;
}

export const useXlsFormOnline = (baseUrl: Ref<string | undefined>) => {
	const convertXlsForm = async (file: File) => {
		let error: string | null = null;
		let data: XlsOnlineResponse | null = null;

		if (!baseUrl.value) {
			error =
				'Failed to initialize XLSForm Online service, please refresh the page. If problem persists, please report it on ODK Forum.';
			return { data, error };
		}

		const formData = new FormData();

		formData.append('file', file);

		try {
			const res = await fetch(`${baseUrl.value}/api/xlsform`, {
				method: 'POST',
				body: formData,
			});
			if (res.ok) {
				data = (await res.json()) as XlsOnlineResponse;
			} else {
				error = `Error connecting to xlsform-online server, status: ${res.status}. If problem persists, please report it on ODK Forum.`;
			}
		} catch (fetchError: unknown) {
			error = String(fetchError);
		}

		return { data, error };
	};

	return { convertXlsForm };
};
