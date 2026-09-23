import type { FormInstanceConfig, RootNode } from '@getodk/xforms-engine';
import type { EffectFunction, Owner } from 'solid-js';
import { createEffect, createRoot } from 'solid-js';
import { createMutable } from 'solid-js/store';
import type { InitializableForm, TestFormOptions } from '../client/init.ts';
import { getAssertedOwner, runInSolidScope } from '../client/solid-helpers.ts';
import type { ScenarioConfig } from '../jr/Scenario.ts';
import { Scenario } from '../jr/Scenario.ts';

export class ReactiveScenario extends Scenario {
  static override getTestFormOptions(overrideOptions?: Partial<TestFormOptions>): TestFormOptions {
    return super.getTestFormOptions({
      ...overrideOptions,
      stateFactory: createMutable,
    });
  }

  private readonly testScopedOwner: Owner;

  constructor(baseConfig: ScenarioConfig, form: InitializableForm, instanceRoot: RootNode) {
    let dispose!: VoidFunction;

    const testScopedOwner = createRoot((disposeRoot) => {
      dispose = () => {
        disposeRoot();
        baseConfig.dispose();
      };

      return getAssertedOwner();
    });

    super({ ...baseConfig, dispose }, form, instanceRoot);

    this.testScopedOwner = testScopedOwner;
  }

  override editCurrentInstance(config?: FormInstanceConfig): Promise<this> {
    return super.editCurrentInstance({ ...config, stateFactory: createMutable });
  }

  createEffect<Next>(fn: EffectFunction<NoInfer<Next> | undefined, Next>): void {
    runInSolidScope(this.testScopedOwner, () => {
      createEffect(fn);
    });
  }
}
