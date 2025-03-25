import type { FormInstanceConfig } from '@getodk/xforms-engine';
import { reactive } from 'vue';

export const ENGINE_FORM_INSTANCE_CONFIG: FormInstanceConfig = {
	stateFactory: reactive,
};
