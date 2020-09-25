import sinon from 'sinon';

import Form from '../../../src/presenters/form';
import FormVersionDefDropdown from '../../../src/components/form-version/def-dropdown.vue';
import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

describe('FormVersionDefDropdown', () => {
  describe('view XML', () => {
    it('sends the correct request for a published version', () => {
      const form = testData.extendedForms.createPast(1).last();
      return mockHttp()
        .mount(FormVersionDefDropdown, {
          propsData: { version: new Form(form) }
        })
        .request(trigger.click('a'))
        .beforeEachResponse((_, { method, url }) => {
          method.should.equal('GET');
          url.should.equal('/v1/projects/1/forms/f/versions/v1.xml');
        })
        .respondWithData(() => '<x/>');
    });

    it('sends the correct request for a draft', () => {
      testData.extendedForms.createPast(1, { draft: true });
      const draft = testData.extendedFormDrafts.last();
      return mockHttp()
        .mount(FormVersionDefDropdown, {
          propsData: { version: new Form(draft) }
        })
        .request(trigger.click('a'))
        .beforeEachResponse((_, { method, url }) => {
          method.should.equal('GET');
          url.should.equal('/v1/projects/1/forms/f/draft.xml');
        })
        .respondWithData(() => '<x/>');
    });

    it('stores the XML', () => {
      const form = testData.extendedForms.createPast(1).last();
      return mockHttp()
        .mount(FormVersionDefDropdown, {
          propsData: { version: new Form(form) }
        })
        .request(trigger.click('a'))
        .respondWithData(() => '<x/>')
        .afterResponse(dropdown => {
          const { formVersionXml } = dropdown.vm.$store.state.request.data;
          formVersionXml.should.equal('<x/>');
        });
    });

    it('emits an event', () => {
      const form = testData.extendedForms.createPast(1).last();
      const fake = sinon.fake();
      return mockHttp()
        .mount(FormVersionDefDropdown, {
          propsData: { version: new Form(form) }
        })
        .request(dropdown => {
          sinon.replace(dropdown.vm, '$emit', fake);
          return trigger.click(dropdown, 'a');
        })
        .beforeAnyResponse(() => {
          fake.calledWith('view-xml').should.be.true();
        })
        .respondWithData(() => '<x/>');
    });
  });

  describe('download XML', () => {
    it('shows the correct text for a version without an XLSForm', () => {
      const form = testData.extendedForms
        .createPast(1, { excelContentType: null })
        .last();
      const dropdown = mount(FormVersionDefDropdown, {
        propsData: { version: new Form(form) }
      });
      dropdown.find('a')[1].text().trim().should.equal('Download XML');
    });

    it('shows the correct text for a version with an XLSForm', () => {
      const form = testData.extendedForms
        .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
        .last();
      const dropdown = mount(FormVersionDefDropdown, {
        propsData: { version: new Form(form) }
      });
      const text = dropdown.find('a')[1].text().trim();
      text.should.equal('Download as XForm (.xml)');
    });

    it('has the correct href attribute for a published version', () => {
      const form = testData.extendedForms.createPast(1).last();
      const dropdown = mount(FormVersionDefDropdown, {
        propsData: { version: new Form(form) }
      });
      const href = dropdown.find('a')[1].getAttribute('href');
      href.should.equal('/v1/projects/1/forms/f/versions/v1.xml');
    });

    it('has the correct href attribute for a draft', () => {
      testData.extendedForms.createPast(1, { draft: true });
      const draft = testData.extendedFormDrafts.last();
      const dropdown = mount(FormVersionDefDropdown, {
        propsData: { version: new Form(draft) }
      });
      const href = dropdown.find('a')[1].getAttribute('href');
      href.should.equal('/v1/projects/1/forms/f/draft.xml');
    });

    it('has the correct download attribute', () => {
      const form = testData.extendedForms.createPast(1).last();
      const dropdown = mount(FormVersionDefDropdown, {
        propsData: { version: new Form(form) }
      });
      dropdown.find('a')[1].getAttribute('download').should.equal('f.xml');
    });
  });

  describe('download XLSForm', () => {
    it('renders a download link for a version with an XLSForm', () => {
      const form = testData.extendedForms
        .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
        .last();
      const dropdown = mount(FormVersionDefDropdown, {
        propsData: { version: new Form(form) }
      });
      dropdown.find('a').length.should.equal(3);
    });

    it('does not render a download link for a version without an XLSForm', () => {
      const form = testData.extendedForms
        .createPast(1, { excelContentType: null })
        .last();
      const dropdown = mount(FormVersionDefDropdown, {
        propsData: { version: new Form(form) }
      });
      dropdown.find('a').length.should.equal(2);
    });

    describe('.xls file', () => {
      it('shows the correct text', () => {
        const form = testData.extendedForms
          .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
          .last();
        const dropdown = mount(FormVersionDefDropdown, {
          propsData: { version: new Form(form) }
        });
        const text = dropdown.find('a')[2].text().trim();
        text.should.equal('Download as XLSForm (.xls)');
      });

      it('has the correct href attribute for a published version', () => {
        const form = testData.extendedForms
          .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
          .last();
        const dropdown = mount(FormVersionDefDropdown, {
          propsData: { version: new Form(form) }
        });
        const href = dropdown.find('a')[2].getAttribute('href');
        href.should.equal('/v1/projects/1/forms/f/versions/v1.xls');
      });

      it('has the correct href attribute for a draft', () => {
        testData.extendedForms.createPast(1, {
          draft: true,
          excelContentType: 'application/vnd.ms-excel'
        });
        const draft = testData.extendedFormDrafts.last();
        const dropdown = mount(FormVersionDefDropdown, {
          propsData: { version: new Form(draft) }
        });
        const href = dropdown.find('a')[2].getAttribute('href');
        href.should.equal('/v1/projects/1/forms/f/draft.xls');
      });
    });

    describe('.xlsx file', () => {
      it('shows the correct text', () => {
        const form = testData.extendedForms
          .createPast(1, {
            excelContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
          .last();
        const dropdown = mount(FormVersionDefDropdown, {
          propsData: { version: new Form(form) }
        });
        const text = dropdown.find('a')[2].text().trim();
        text.should.equal('Download as XLSForm (.xlsx)');
      });

      it('has the correct href attribute for a published version', () => {
        const form = testData.extendedForms
          .createPast(1, {
            excelContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
          .last();
        const dropdown = mount(FormVersionDefDropdown, {
          propsData: { version: new Form(form) }
        });
        const href = dropdown.find('a')[2].getAttribute('href');
        href.should.equal('/v1/projects/1/forms/f/versions/v1.xlsx');
      });

      it('has the correct href attribute for a draft', () => {
        testData.extendedForms.createPast(1, {
          draft: true,
          excelContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const draft = testData.extendedFormDrafts.last();
        const dropdown = mount(FormVersionDefDropdown, {
          propsData: { version: new Form(draft) }
        });
        const href = dropdown.find('a')[2].getAttribute('href');
        href.should.equal('/v1/projects/1/forms/f/draft.xlsx');
      });
    });
  });
});
