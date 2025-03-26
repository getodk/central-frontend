import { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';
import { afterEach, beforeEach } from 'vitest';

let state: SharedJRResourceService | null = null;

export class SharedJRResourceService extends JRResourceService {
	static init(): SharedJRResourceService {
		state ??= new this();
		return state;
	}

	private constructor() {
		super();

		beforeEach(() => {
			this.reset();
		});

		afterEach(() => {
			this.reset();
		});
	}
}
