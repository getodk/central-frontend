import { ref } from 'vue';

interface Configuration {
	'xlsform-online-url': string;
}

export const useConfiguration = () => {
	const data = ref<Configuration | null>(null);
	const error = ref<string | null>(null);

	fetch('config.json')
		.then((res) => res.json())
		.then((json: Configuration) => (data.value = json))
		.catch((err: string) => (error.value = err));

	return { data, error };
};
