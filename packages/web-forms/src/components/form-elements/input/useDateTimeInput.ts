import { computed, type ComputedRef } from 'vue';
import { usePrimeVue } from 'primevue';

interface DateTimeInputComposable {
	readonly localeDateFormat: ComputedRef<string>;
	readonly hourFormat: ComputedRef<'12' | '24'>;
	readonly clearSubMinute: (date: Date) => void;
	readonly timeStringToDate: (timeValue: string) => Date;
	readonly getTemporalString: (
		value: { toString(): string } | null,
		pattern: RegExp
	) => string | null;
}

const getTemporalString = (value: { toString(): string } | null, pattern: RegExp) => {
	if (value == null) {
		return null;
	}
	const str = value.toString();
	return pattern.test(str) ? str : null;
};

const clearSubMinute = (date: Date): void => {
	date.setMilliseconds(0);
	date.setSeconds(0);
};

const timeStringToDate = (timeValue: string): Date => {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	return new Date(`${yyyy}-${mm}-${dd}T${timeValue}`);
};

export const useDateTimeInput = (): DateTimeInputComposable => {
	const primevue = usePrimeVue();

	const localeDateFormat = computed(() => primevue.config.locale?.dateFormat ?? '');

	// TODO: derive hourFormat from active UI locale (tracked in https://github.com/getodk/web-forms/issues/670)
	const hourFormat = computed((): '12' | '24' => '12');

	return {
		localeDateFormat,
		hourFormat,
		clearSubMinute,
		timeStringToDate,
		getTemporalString,
	};
};
