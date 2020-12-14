import { Settings } from 'luxon';

import DateTime from '../../../src/components/date-time.vue';
import SubmissionRow from '../../../src/components/submission/row.vue';

import Field from '../../../src/presenters/field';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { setLuxon } from '../../util/date-time';

const mountComponent = (propsData = {}) => mount(SubmissionRow, {
  propsData: {
    baseUrl: propsData.rowNumber == null ? '/base' : '',
    submission: testData.submissionOData().value[0],
    fields: propsData.rowNumber == null
      ? testData.extendedForms.last()._fields.map(field => new Field(field))
      : null,
    ...propsData
  }
});

describe('SubmissionRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  it('shows the row number', () => {
    testData.extendedForms.createPast(1, { submissions: 1000 });
    testData.extendedSubmissions.createPast(1);
    const td = mountComponent({ rowNumber: 1000 }).first('td');
    td.hasClass('row-number').should.be.true();
    td.text().trim().should.equal('1000');
  });

  describe('submitter name', () => {
    it('shows the submitter name if showsSubmitter is true', () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent({ rowNumber: 1, showsSubmitter: true });
      const td = row.find('td')[1];
      td.hasClass('submitter-name').should.be.true();
      td.text().trim().should.equal('Alice');
      td.getAttribute('title').should.equal('Alice');
    });

    it('does not show the submitter name if showsSubmitter is false', () => {
      testData.extendedForms.createPast(1, { submissions: 1 });
      testData.extendedSubmissions.createPast(1);
      const row = mountComponent({ rowNumber: 1, showsSubmitter: false });
      row.find('.submitter-name').length.should.equal(0);
    });
  });

  it('shows the submission date', () => {
    testData.extendedForms.createPast(1, { submissions: 1 });
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    const row = mountComponent({ rowNumber: 1 });
    row.first(DateTime).getProp('iso').should.equal(createdAt);
  });

  it('shows an empty string if the value of a field does not exist', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.string('/s')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, { s: null });
    const td = mountComponent().first('td');
    td.text().should.equal('');
    td.hasAttribute('title').should.be.false();
  });

  it('correctly formats a string value', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.string('/s')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, { s: 'foo' });
    const td = mountComponent().first('td');
    td.text().should.equal('foo');
    td.getAttribute('title').should.equal('foo');
    td.hasAttribute('class').should.be.false();
  });

  describe('int values', () => {
    it('adds the int-field class', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.int('/i')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { i: 1000 });
      mountComponent().first('td').hasClass('int-field').should.be.true();
    });

    it('correct formats the value', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.int('/i')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { i: 1000 });
      const td = mountComponent().first('td');
      td.text().should.equal('1,000');
      td.getAttribute('title').should.equal('1,000');
    });
  });

  describe('decimal values', () => {
    it('adds the decimal-field class', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.decimal('/d')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1);
      mountComponent().first('td').hasClass('decimal-field').should.be.true();
    });

    // Array of test cases, where each case is an array with the following
    // structure:
    // [raw value, expected formatted value]
    const cases = [
      [1, '1'],
      [1234, '1,234'],
      [1.2, '1.2'],
      [-1.2, '-1.2'],
      [1234.5678901234, '1,234.5678901234'],
      [-1234.567890123, '-1,234.567890123'],
      [0.0000000000001, '0.0000000000001'],
      [-0.000000000001, '-0.000000000001'],
      // More than 15 characters
      [1000000000000000, '1,000,000,000,000,000'],
      [-100000000000000, '-100,000,000,000,000'],
      [10000000000000.1, '10,000,000,000,000.1'],
      [-1000000000000.1, '-1,000,000,000,000.1'],
      [1234.56789012345, '1,234.5678901235'],
      [-1234.5678901234, '-1,234.567890123'],
      [0.00000000000001, '0'],
      [-0.0000000000001, '-0']
    ];

    for (const [rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.decimal('/d')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { d: rawValue });
        const td = mountComponent().first('td');
        td.text().should.equal(formattedValue);
        td.getAttribute('title').should.equal(formattedValue);
      });
    }
  });

  describe('date values', () => {
    // Each test case is an array with the following structure:
    // [raw value, expected formatted value]
    const cases = [
      ['2018-01-01', '2018/01/01'],
      // If we end up needing to support time zones, we should check that the
      // existing code accounts for DST.
      ['2018-01-01Z', 'Invalid DateTime'],
      ['2018-01-01+01:00', 'Invalid DateTime'],
      // A date value that is not ISO 8601
      ['2018/01/01', 'Invalid DateTime']
    ];

    for (const [rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.date('/d')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { d: rawValue });
        const td = mountComponent().first('td');
        td.text().should.equal(formattedValue);
        td.getAttribute('title').should.equal(formattedValue);
      });
    }
  });

  describe('time values', () => {
    const originalSettings = {};
    before(() => {
      originalSettings.defaultZoneName = Settings.defaultZoneName;
      originalSettings.now = Settings.now;
    });
    afterEach(() => {
      setLuxon(originalSettings);
    });

    /*
    Each test case is an array with the following structure:

    [
      default time zone (mocking the system time zone),
      ISO 8601 string to use as the current timestamp (mocking the system time),
      raw value,
      expected formatted value
    ]
    */
    const cases = [
      ['UTC+1', null, '01:02:03.567', '01:02:03'],
      ['UTC+1', null, '00:00:00Z', '00:00:00'],
      ['UTC+1', null, '02:00:00+02:00', '02:00:00'],
      ['UTC+1', null, '12 a.m.', 'Invalid DateTime'],
      // DST invalid time
      ['America/New_York', '2017-03-12', '02:30:00', '02:30:00'],
      ['America/New_York', '2017-03-12', '02:30:00Z', '02:30:00'],
      // DST ambiguous time
      ['America/New_York', '2017-11-05', '01:30:00', '01:30:00'],
      ['America/New_York', '2017-11-05', '01:30:00Z', '01:30:00']
    ];

    for (const [defaultZoneName, now, rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.time('/t')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { t: rawValue });

        setLuxon({ defaultZoneName });
        if (now != null) setLuxon({ now });

        const td = mountComponent().first('td');
        td.text().should.equal(formattedValue);
        td.getAttribute('title').should.equal(formattedValue);
      });
    }
  });

  describe('dateTime values', () => {
    const originalSettings = {};
    before(() => {
      originalSettings.defaultZoneName = Settings.defaultZoneName;
      originalSettings.now = Settings.now;
    });
    afterEach(() => {
      setLuxon(originalSettings);
    });

    /*
    Each test case is an array with the following structure:

    [
      default time zone (mocking the system time zone),
      ISO 8601 string to use as the current timestamp (mocking the system time),
      raw value,
      expected formatted value
    ]
    */
    const cases = [
      ['UTC+1', null, '2018-01-01T01:02:03.567', '2018/01/01 01:02:03'],
      ['UTC+1', null, '2018-01-01T00:00:00Z', '2018/01/01 01:00:00'],
      ['UTC+1', null, '2018-01-01T02:00:00+02:00', '2018/01/01 01:00:00'],
      ['UTC+1', null, '2018/01/01T00:00:00', 'Invalid DateTime'],
      // DST invalid time
      ['America/New_York', '2017-03-12', '2017-03-12T02:30:00', '2017/03/12 03:30:00'],
      ['America/New_York', '2017-03-12', '2017-03-12T02:30:00Z', '2017/03/11 21:30:00'],
      // DST ambiguous time
      ['America/New_York', '2017-11-05', '2017-11-05T01:30:00', '2017/11/05 01:30:00'],
      ['America/New_York', '2017-11-05', '2017-11-05T01:30:00Z', '2017/11/04 21:30:00']
    ];

    for (const [defaultZoneName, now, rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.dateTime('/dt')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { dt: rawValue });

        setLuxon({ defaultZoneName });
        if (now != null) setLuxon({ now });

        const td = mountComponent().first('td');
        td.text().should.equal(formattedValue);
        td.getAttribute('title').should.equal(formattedValue);
      });
    }
  });

  describe('geopoint values', () => {
    const geopoint = (...coordinates) => ({ type: 'Point', coordinates });
    // Each test case is an array with the following structure:
    // [raw value, expected formatted value]
    const cases = [
      [geopoint(0.1234567, 0.1234567), '0.1234567 0.1234567'],
      [geopoint(0.123456, 0.123456), '0.1234560 0.1234560'],
      [geopoint(0.12345678, 0.12345678), '0.1234568 0.1234568'],
      [geopoint(0.1234567, 0.1234567, 0.1), '0.1234567 0.1234567 0.1'],
      [geopoint(0.1234567, 0.1234567, 0), '0.1234567 0.1234567 0.0'],
      [geopoint(0.1234567, 0.1234567, 0.15), '0.1234567 0.1234567 0.2']
    ];

    for (const [rawValue, formattedValue] of cases) {
      it(`correctly formats ${rawValue.coordinates.join(' ')}`, () => {
        testData.extendedForms.createPast(1, {
          fields: [testData.fields.geopoint('/g')],
          submissions: 1
        });
        testData.extendedSubmissions.createPast(1, { g: rawValue });
        const td = mountComponent().first('td');
        td.text().should.equal(formattedValue);
        td.getAttribute('title').should.equal(formattedValue);
      });
    }
  });

  describe('binary field', () => {
    it("correctly renders a field of type 'binary'", () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.binary('/b')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        instanceId: 'a b',
        b: 'c d.jpg'
      });
      const td = mountComponent().first('td');
      td.hasClass('binary-field').should.be.true();
      td.hasAttribute('title').should.be.false();
      const a = td.first('a');
      const href = a.getAttribute('href');
      href.should.equal('/base/submissions/a%20b/attachments/c%20d.jpg');
      a.find('.icon-check').length.should.equal(1);
      a.find('.icon-download').length.should.equal(1);
    });

    it('correctly renders a binary field of unknown type', () => {
      testData.extendedForms.createPast(1, {
        fields: [
          { path: '/b', name: 'b', type: 'something_unknown', binary: true }
        ],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        instanceId: 'foo',
        b: 'bar.jpg'
      });
      const td = mountComponent().first('td');
      td.hasClass('binary-field').should.be.true();
      const href = td.first('a').getAttribute('href');
      href.should.equal('/base/submissions/foo/attachments/bar.jpg');
    });

    it('does not render a link if the value does not exist', () => {
      testData.extendedForms.createPast(1, {
        fields: [testData.fields.binary('/b')],
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, { b: null });
      const td = mountComponent().first('td');
      td.find('a').length.should.equal(0);
      td.text().should.equal('');
    });
  });

  it('shows the instance ID', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.int('/i')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, { instanceId: 'foo' });
    const td = mountComponent().find('td');
    td.length.should.equal(2);
    td[1].text().should.equal('foo');
    td[1].getAttribute('title').should.equal('foo');
  });

  it('renders a cell for each field', () => {
    testData.extendedForms.createPast(1, {
      fields: [testData.fields.string('/s1'), testData.fields.string('/s2')],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 'foo',
      s1: 'bar',
      s2: 'baz'
    });
    const td = mountComponent().find('td');
    td.length.should.equal(3);
    td.map(wrapper => wrapper.text()).should.eql(['bar', 'baz', 'foo']);
  });
});
