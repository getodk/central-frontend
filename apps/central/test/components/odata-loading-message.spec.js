import OdataLoadingMessage from '../../src/components/odata-loading-message.vue';

import { mount } from '../util/lifecycle';

describe('OdataLoadingMessage', () => {
  /* eslint-disable no-multi-spaces */
  const cases = [
    ['',                                                      { state: false }],
    ['Loading Submissions…',                                  { state: true }],
    ['Loading 10 Submissions…',                               { state: true, top: 250, totalCount: 10 }],
    ['Loading the first 10 of 100 Submissions…',              { state: true, top: 10, totalCount: 100 }],
    // totalCount is 0.
    ['Loading Submissions…',                                  { state: true, top: 250, totalCount: 0 }],
    // No `top`
    ['Loading 10 Submissions…',                               { state: true, totalCount: 10 }],
    ['Loading matching Submissions…',                         { state: true, filter: true }],

    ['Loading Entities…',                                     { state: true, type: 'entity' }],
    ['Loading matching Entities…',                            { state: true, type: 'entity', filter: true }]
  ];
  /* eslint-enable no-multi-spaces */

  for (const [expectedMessage, props] of cases) {
    it(`should say "${expectedMessage}"`, () => {
      const component = mount(OdataLoadingMessage, {
        props: { type: 'submission', ...props }
      });
      component.text().should.be.eql(expectedMessage);
    });
  }
});
