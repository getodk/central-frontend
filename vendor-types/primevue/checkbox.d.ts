import type { HTMLInputElementEvent } from 'primevue/events';

declare module 'primevue/checkbox' {
	interface CheckboxEmits {
		change(event: HTMLInputElementEvent): void;
	}
}
