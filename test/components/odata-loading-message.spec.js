import { mount } from '../util/lifecycle';

import OdataLoadingMessage from '../../src/components/odata-loading-message.vue';

describe('OdataLoadingMessage', () => {
  /* eslint-disable no-multi-spaces */
  const cases = [
    ['',                                                      { dataExists: false, awaitingResponse: false, top: 0, refreshing: false, filter: false, totalCount: 0 }],
    ['Loading matching Submissions…',                         { dataExists: false, awaitingResponse: true, top: 0, refreshing: false, filter: true, totalCount: 0 }],
    ['Loading Submissions…',                                  { dataExists: false, awaitingResponse: true, top: 0, refreshing: false, filter: false, totalCount: 0 }],
    ['Loading 10 Submissions…',                               { dataExists: false, awaitingResponse: true, top: 250, refreshing: false, filter: false, totalCount: 10 }],
    ['Loading the first 10 of 100 Submissions…',              { dataExists: false, awaitingResponse: true, top: 10, refreshing: false, filter: false, totalCount: 100 }],
    ['',                                                      { dataExists: true, awaitingResponse: true, top: 10, refreshing: false, filter: false, totalCount: 100, originalCount: 100, dataLength: 10 }],
    ['',                                                      { dataExists: true, awaitingResponse: true, top: 10, refreshing: false, filter: false, totalCount: 15, originalCount: 15, dataLength: 10 }],
    ['',                                                      { dataExists: true, awaitingResponse: true, top: 10, refreshing: false, filter: false, totalCount: 11, originalCount: 11, dataLength: 10 }],
    ['',                                                      { dataExists: true, awaitingResponse: true, top: 10, refreshing: false, filter: true, totalCount: 100, originalCount: 100, dataLength: 10 }],
    ['',                                                      { dataExists: true, awaitingResponse: true, top: 10, refreshing: false, filter: true, totalCount: 15, originalCount: 15, dataLength: 10 }],
    ['',                                                      { dataExists: true, awaitingResponse: true, top: 10, refreshing: false, filter: true, totalCount: 11, originalCount: 11, dataLength: 10 }],

    ['Loading Entities…',                                     { dataExists: false, awaitingResponse: true, type: 'entity', top: 0, refreshing: false, filter: false, totalCount: 0 }],
    ['Loading matching Entities…',                            { dataExists: false, awaitingResponse: true, type: 'entity', top: 0, refreshing: false, filter: true, totalCount: 0 }]
  ];
  /* eslint-enable no-multi-spaces */

  for (const [expectedMessage, data] of cases) {
    it(`should say "${expectedMessage}"`, () => {
      const component = mount(OdataLoadingMessage, {
        props: {
          odata: { dataExists: data.dataExists, awaitingResponse: data.awaitingResponse, originalCount: data.originalCount, value: new Array(data.dataLength) },
          top: data.top,
          refreshing: data.refreshing,
          filter: data.filter,
          totalCount: data.totalCount,
          type: data.type ?? 'submission'
        }
      });
      component.text().should.be.eql(expectedMessage);
    });
  }
});
