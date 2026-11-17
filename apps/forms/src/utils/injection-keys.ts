import type { MapProvider } from '@getodk/web-forms';
import type { InjectionKey } from 'vue';

export const MAP_PROVIDER: InjectionKey<MapProvider> = Symbol('mapProvider');
