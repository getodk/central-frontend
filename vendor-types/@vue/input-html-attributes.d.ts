import { HTMLAttributes } from 'vue';

declare module 'vue' {
	export interface HTMLInputElementEvent extends Event {
		target: HTMLInputElement;
	}

	export interface InputHTMLAttributes extends HTMLAttributes {
		onChange?: (HTMLInputElementEvent) => void;
	}
}
