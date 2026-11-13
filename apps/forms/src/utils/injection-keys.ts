import type { InjectionKey } from 'vue';

export const GOOGLE_MAPS_KEY: InjectionKey<string | undefined> = Symbol('googleMapsKey');
