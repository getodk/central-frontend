import type { HtmlXFormsElement } from '@getodk/common/test-utils/xform-dsl/HtmlXFormsElement.ts';
import {
  bind,
  body,
  group,
  head,
  html,
  input,
  instance,
  item,
  label,
  mainInstance,
  model,
  repeat,
  select1,
  setvalue,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ValidationCondition, ViolationMessage } from '../../../src/client/validation.ts';
import { createInstance } from '../../../src/entrypoints/createInstance.ts';
import { reactiveTestScope } from '../../helpers/reactive/internal.ts';

describe('createAggregatedViolations - reactive aggregated `constraint` and `required` validation violations on ancestor nodes', () => {
  let definition: HtmlXFormsElement;

  beforeEach(() => {
    // Reduced from https://github.com/sadiqkhoja/web-forms/blob/5e678e133584555990c6a19aeecc59561610f6c9/packages/ui-solid/fixtures/xforms/validation/1-validation.xml
    // prettier-ignore
    definition = html(
			head(
				title('Validation Form'),
				model(
					mainInstance(
						t('data id="validation"',
							t('contactdetails',
								t('residentialAddress'),
								t('phone',
									t('home'))),
							t('colors-outer',
								t('colors-inner',
									t('color')),
								t('other-color')),
							t('meta',
								t('instanceID')))),
						bind('/data/contactdetails/residentialAddress').required(),
						bind('/data/contactdetails/phone/home').required(),
						bind('/data/colors-outer/colors-inner/color').required(),
						bind('/data/colors-outer/other-color').required())
			),
			body(
				group(
					'/data/contactdetails',
					label('Household'),

					input('/data/contactdetails/residentialAddress',
						label('Residential address')),

					group('/data/contactdetails/phone',
						label('Phone numbers'),

						input('/data/contactdetails/phone/home',
							label('Home phone no.')))),

				group('/data/colors-outer',
					label('Colors: outer'),

					group('/data/colors-outer/colors-inner',
						label('Colors: inner'),

						select1('/data/colors-outer/colors-inner/color',
							label('Color'),
							item('red', 'Red'),
							item('green', 'Green'))),

					select1('/data/colors-outer/other-color',
						label('Other color'),
						item('purple', 'Purple'),
						item('mauve', 'Mauve')))));
  });

  interface SimplifiedViolation {
    readonly condition: ValidationCondition;
    readonly valid: false;
    readonly message: ViolationMessage<ValidationCondition> | string | null;
  }

  interface SimplifiedViolationReference {
    readonly reference: string;
    readonly violation: SimplifiedViolation;
  }

  // prettier-ignore
  type ObservedViolationReferences = Array<
		readonly SimplifiedViolationReference[]
	>;

  describe('check assumptions: ensure observing violation state is effective', () => {
    it('observes violations of a direct string input child', async () => {
      const observed = await reactiveTestScope(async ({ effect, mutable }) => {
        const { root } = await createInstance(definition.asXml(), {
          instance: {
            stateFactory: mutable,
          },
        });

        const contactDetails = root.currentState.children[0];

        if (
          contactDetails?.nodeType !== 'group' ||
          contactDetails.currentState.reference !== '/data/contactdetails'
        ) {
          throw new Error('Expected group /data/contactdetails');
        }

        const phone = contactDetails.currentState.children[1];

        if (
          phone?.nodeType !== 'group' ||
          phone.currentState.reference !== '/data/contactdetails/phone'
        ) {
          throw new Error('Expected group /data/contactdetails/phone');
        }

        const observedViolations: ObservedViolationReferences = [];

        effect(() => {
          observedViolations.push(
            phone.validationState.violations.map((violationReference) => {
              const violation: SimplifiedViolation = {
                condition: violationReference.violation.condition,
                valid: violationReference.violation.valid,
                message: violationReference.violation.message,
              };

              return {
                reference: violationReference.reference,
                violation,
              };
            })
          );
        });

        return observedViolations;
      });

      expect(observed).toEqual([
        // Initially invalid
        [
          {
            reference: '/data/contactdetails/phone/home',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],
      ]);
    });

    it('observes violations of a direct select child', async () => {
      const observed = await reactiveTestScope(async ({ effect, mutable }) => {
        const { root } = await createInstance(definition.asXml(), {
          instance: {
            stateFactory: mutable,
          },
        });

        const colorsOuter = root.currentState.children[1];

        if (
          colorsOuter?.nodeType !== 'group' ||
          colorsOuter.currentState.reference !== '/data/colors-outer'
        ) {
          throw new Error('Expected group /data/colors-outer');
        }

        const colorsInner = colorsOuter.currentState.children[0];

        if (
          colorsInner?.nodeType !== 'group' ||
          colorsInner.currentState.reference !== '/data/colors-outer/colors-inner'
        ) {
          throw new Error('Expected group /data/colors-outer/colors-inner');
        }

        const observedViolations: ObservedViolationReferences = [];

        effect(() => {
          observedViolations.push(
            colorsInner.validationState.violations.map((violationReference) => {
              const violation: SimplifiedViolation = {
                condition: violationReference.violation.condition,
                valid: violationReference.violation.valid,
                message: violationReference.violation.message,
              };

              return {
                reference: violationReference.reference,
                violation,
              };
            })
          );
        });

        return observedViolations;
      });

      expect(observed).toEqual([
        // Initially invalid
        [
          {
            reference: '/data/colors-outer/colors-inner/color',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],
      ]);
    });
  });

  describe('direct children', () => {
    it('reactively updates when a direct string input child becomes valid', async () => {
      const observed = await reactiveTestScope(async ({ effect, mutable }) => {
        const { root } = await createInstance(definition.asXml(), {
          instance: {
            stateFactory: mutable,
          },
        });

        const contactDetails = root.currentState.children[0];

        if (
          contactDetails?.nodeType !== 'group' ||
          contactDetails.currentState.reference !== '/data/contactdetails'
        ) {
          throw new Error('Expected group /data/contactdetails');
        }

        const phone = contactDetails.currentState.children[1];

        if (
          phone?.nodeType !== 'group' ||
          phone.currentState.reference !== '/data/contactdetails/phone'
        ) {
          throw new Error('Expected group /data/contactdetails/phone');
        }

        const observedViolations: ObservedViolationReferences = [];

        effect(() => {
          observedViolations.push(
            phone.validationState.violations.map((violationReference) => {
              const violation: SimplifiedViolation = {
                condition: violationReference.violation.condition,
                valid: violationReference.violation.valid,
                message: violationReference.violation.message,
              };

              return {
                reference: violationReference.reference,
                violation,
              };
            })
          );
        });

        const home = phone.currentState.children[0];

        if (
          home?.currentState.reference !== '/data/contactdetails/phone/home' ||
          home.nodeType !== 'input'
        ) {
          throw new Error('Expected input node /data/contactdetails/phone/home');
        }

        // Satisfy `required` condition
        home.setValue('555-867-5309');

        return observedViolations;
      });

      expect(observed).toEqual([
        // Initially invalid
        [
          {
            reference: '/data/contactdetails/phone/home',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],

        // Valid after change
        [],
      ]);
    });

    it('reactively updates when a direct select child becomes valid', async () => {
      const observed = await reactiveTestScope(async ({ effect, mutable }) => {
        const { root } = await createInstance(definition.asXml(), {
          instance: {
            stateFactory: mutable,
          },
        });

        const colorsOuter = root.currentState.children[1];

        if (
          colorsOuter?.nodeType !== 'group' ||
          colorsOuter.currentState.reference !== '/data/colors-outer'
        ) {
          throw new Error('Expected group /data/colors-outer');
        }

        const colorsInner = colorsOuter.currentState.children[0];

        if (
          colorsInner?.nodeType !== 'group' ||
          colorsInner.currentState.reference !== '/data/colors-outer/colors-inner'
        ) {
          throw new Error('Expected group /data/colors-outer/colors-inner');
        }

        const observedViolations: ObservedViolationReferences = [];

        effect(() => {
          observedViolations.push(
            colorsInner.validationState.violations.map((violationReference) => {
              const violation: SimplifiedViolation = {
                condition: violationReference.violation.condition,
                valid: violationReference.violation.valid,
                message: violationReference.violation.message,
              };

              return {
                reference: violationReference.reference,
                violation,
              };
            })
          );
        });

        const color = colorsInner.currentState.children[0];

        if (
          color?.nodeType !== 'select' ||
          color.currentState.reference !== '/data/colors-outer/colors-inner/color'
        ) {
          throw new Error('Expected select /data/colors-outer/colors-inner/color');
        }

        const [option] = color.currentState.valueOptions;

        if (option == null) {
          throw new Error('Cannot set value of select, no options available');
        }

        // Satisfy `required` condition
        color.selectValue(option.value);

        return observedViolations;
      });

      expect(observed).toEqual([
        // Initially invalid
        [
          {
            reference: '/data/colors-outer/colors-inner/color',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],

        // Valid after change
        [],
      ]);
    });
  });

  describe('deeper descendants', () => {
    it('reactively updates when a deeper string input descendant becomes valid', async () => {
      const observed = await reactiveTestScope(async ({ effect, mutable }) => {
        const { root } = await createInstance(definition.asXml(), {
          instance: {
            stateFactory: mutable,
          },
        });

        const contactDetails = root.currentState.children[0];

        if (
          contactDetails?.nodeType !== 'group' ||
          contactDetails.currentState.reference !== '/data/contactdetails'
        ) {
          throw new Error('Expected group /data/contactdetails');
        }

        const observedViolations: ObservedViolationReferences = [];

        effect(() => {
          observedViolations.push(
            contactDetails.validationState.violations.map((violationReference) => {
              const violation: SimplifiedViolation = {
                condition: violationReference.violation.condition,
                valid: violationReference.violation.valid,
                message: violationReference.violation.message,
              };

              return {
                reference: violationReference.reference,
                violation,
              };
            })
          );
        });

        const phone = contactDetails.currentState.children[1];

        if (
          phone?.nodeType !== 'group' ||
          phone.currentState.reference !== '/data/contactdetails/phone'
        ) {
          throw new Error('Expected group /data/contactdetails/phone');
        }

        const home = phone.currentState.children[0];

        if (
          home?.currentState.reference !== '/data/contactdetails/phone/home' ||
          home.nodeType !== 'input'
        ) {
          throw new Error('Expected input node /data/contactdetails/phone/home');
        }

        // Satisfy `required` condition
        home.setValue('555-867-5309');

        return observedViolations;
      });

      expect(observed).toEqual([
        // Both descendants initially invalid
        [
          {
            reference: '/data/contactdetails/residentialAddress',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
          {
            reference: '/data/contactdetails/phone/home',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],

        // Direct child still invalid; deeper descendant valid after change
        [
          {
            reference: '/data/contactdetails/residentialAddress',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],
      ]);
    });

    it('reactively updates when a deeper select descendant becomes valid', async () => {
      const observed = await reactiveTestScope(async ({ effect, mutable }) => {
        const { root } = await createInstance(definition.asXml(), {
          instance: {
            stateFactory: mutable,
          },
        });

        const colorsOuter = root.currentState.children[1];

        if (
          colorsOuter?.nodeType !== 'group' ||
          colorsOuter.currentState.reference !== '/data/colors-outer'
        ) {
          throw new Error('Expected group /data/colors-outer');
        }

        const observedViolations: ObservedViolationReferences = [];

        effect(() => {
          observedViolations.push(
            colorsOuter.validationState.violations.map((violationReference) => {
              const violation: SimplifiedViolation = {
                condition: violationReference.violation.condition,
                valid: violationReference.violation.valid,
                message: violationReference.violation.message,
              };

              return {
                reference: violationReference.reference,
                violation,
              };
            })
          );
        });

        const colorsInner = colorsOuter.currentState.children[0];

        if (
          colorsInner?.nodeType !== 'group' ||
          colorsInner.currentState.reference !== '/data/colors-outer/colors-inner'
        ) {
          throw new Error('Expected group /data/colors-outer/colors-inner');
        }

        const color = colorsInner.currentState.children[0];

        if (
          color?.nodeType !== 'select' ||
          color.currentState.reference !== '/data/colors-outer/colors-inner/color'
        ) {
          throw new Error('Expected select /data/colors-outer/colors-inner/color');
        }

        const [option] = color.currentState.valueOptions;

        if (option == null) {
          throw new Error('Cannot set value of select, no options available');
        }

        // Satisfy `required` condition
        color.selectValue(option.value);

        return observedViolations;
      });

      expect(observed).toEqual([
        // Both descendants initially invalid
        [
          {
            reference: '/data/colors-outer/colors-inner/color',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
          {
            reference: '/data/colors-outer/other-color',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],

        // Direct child still invalid; deeper descendant valid after change
        [
          {
            reference: '/data/colors-outer/other-color',
            violation: {
              condition: 'required',
              valid: false,
              message: null,
            },
          },
        ],
      ]);
    });
  });

  describe('error violations', () => {
    it('violations on groups', async () => {
      definition = html(
        head(
          title('Validation Form'),
          model(
            mainInstance(
              t(
                'data id="validation"',
                t('contactdetails', t('residentialAddress'), t('phone', t('home'))),
                t('meta', t('instanceID'))
              )
            ),
            bind('/data/contactdetails').relevant('unknownfunction()'),
            bind('/data/contactdetails/residentialAddress'),
            bind('/data/contactdetails/phone/home')
          )
        ),
        body(
          group(
            '/data/contactdetails',
            label('Household'),

            input('/data/contactdetails/residentialAddress', label('Residential address')),

            group(
              '/data/contactdetails/phone',
              label('Phone numbers'),

              input('/data/contactdetails/phone/home', label('Home phone no.'))
            )
          )
        )
      );
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/data/contactdetails');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'unknownfunction'"
      );
    });

    it('violations on repeats', async () => {
      definition = html(
        head(
          title('invalid jr:count'),
          model(
            mainInstance(
              t(
                'data id="cast-fractional-value-to-int"',
                t('repeat-count jr:template=""', t('anything'))
              )
            )
          )
        ),
        body(repeat('/data/repeat-count', 'somerandomnumber()'))
      );
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/data/repeat-count');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'somerandomnumber'"
      );
    });

    it('violations on attributes', async () => {
      definition = html(
        head(
          title('Bind attributes'),
          model(
            mainInstance(t('root id="bind-attributes" version=""', t('version'))),
            bind('/root/version').type('string'),
            bind('/root/@version')
              .type('string')
              .calculate('invalidrandomfunction()')
              .readonly('true()')
          )
        ),
        body(input('/root/version'))
      );
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/root/@version');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'invalidrandomfunction'"
      );
    });

    it('violations on itemsets', async () => {
      definition = html(
        head(
          title('itemsets'),
          model(
            mainInstance(t('root id="itemsets" version=""', t('sel'))),
            bind('/root/sel').type('string')
          )
        ),
        body(
          select1(
            '/root/sel',
            t('itemset nodeset="isnt()"', t('label ref="itextId"'), t('value ref="value"'))
          )
        )
      );
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/root/sel');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'isnt'"
      );
    });

    it('violations on itemset value', async () => {
      definition = html(
        head(
          title('itemset value'),
          model(
            mainInstance(t('root id="itemsets" version=""', t('sel'))),
            instance(
              'sec',
              t('item', t('itextId', 'choices-0'), t('name', 'a')),
              t('item', t('itextId', 'choices-1'), t('name', 'b')),
              t('item', t('itextId', 'choices-2'), t('name', 'c'))
            ),
            bind('/root/sel').type('string')
          )
        ),
        body(
          select1(
            '/root/sel',
            t(
              'itemset nodeset="instance(\'sec\')"',
              t('value ref="rndom()"'),
              t('label ref="itextId"')
            )
          )
        )
      );
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/root/sel');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'rndom'"
      );
    });

    it('violations on itemset label', async () => {
      definition = html(
        head(
          title('itemset label'),
          model(
            mainInstance(t('root id="itemsets" version=""', t('sel'))),
            instance(
              'sec',
              t('item', t('itextId', 'choices-0'), t('name', 'a')),
              t('item', t('itextId', 'choices-1'), t('name', 'b')),
              t('item', t('itextId', 'choices-2'), t('name', 'c'))
            ),
            bind('/root/sel').type('string')
          )
        ),
        body(
          select1(
            '/root/sel',
            t(
              'itemset nodeset="instance(\'sec\')"',
              t('label ref="concat(label, nofun())"'),
              t('value ref="name"')
            )
          )
        )
      );
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/root/sel');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'nofun'"
      );
    });

    it('violations on setvalue actions', async () => {
      definition = html(
        head(
          title('setvalue'),
          model(
            mainInstance(t('root id="setvalue" version=""', t('sel'))),
            bind('/root/sel').type('string'),
            setvalue('odk-instance-load', '/root/sel', 'rnd()')
          )
        ),
        body(input('/root/sel'))
      );
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/root/sel');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'rnd'"
      );
    });

    it('violations on value changed actions', async () => {
      definition = html(
        head(
          title('value changed'),
          model(
            mainInstance(t('root id="valuechanged" version=""', t('src'), t('dest'))),
            bind('/root/src').type('string'),
            bind('/root/dest').type('string')
          )
        ),
        body(input('/root/src', setvalue('xforms-value-changed', '/root/dest', 'bah()')))
      );
      const { root } = await createInstance(definition.asXml());
      let violations = root.validationState.violations;
      expect(violations.length).toEqual(0);

      const src = root.currentState.children[0];
      if (src?.nodeType !== 'input' || src.currentState.reference !== '/root/src') {
        throw new Error('Expected input /root/src');
      }
      src.setValue('abc');

      violations = root.validationState.violations;
      expect(violations.length).toEqual(1);
      expect(violations[0]?.reference).toEqual('/root/dest');
      expect(violations[0]?.violation.message).toEqual(
        "Unknown function in form definition: 'bah'"
      );
    });
  });

  describe('violation node reference', () => {
    it('references the violating node itself', async () => {
      const { root } = await createInstance(definition.asXml());
      const violations = root.validationState.violations;

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.map(({ node }) => node.nodeId)).toEqual(
        violations.map(({ nodeId }) => nodeId)
      );
    });
  });
});
