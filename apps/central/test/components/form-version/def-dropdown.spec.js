import FormVersionDefDropdown from '../../../src/components/form-version/def-dropdown.vue';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options) => mergeMountOptions(options, {
  container: { requestData: testRequestData(['formVersionXml']) }
});

describe('FormVersionDefDropdown', () => {
  describe('view XML', () => {
    it('sends the correct request for a published version', () => {
      const form = testData.extendedForms.createPast(1).last();
      return mockHttp()
        .mount(FormVersionDefDropdown, mountOptions({
          props: { version: form }
        }))
        .request(component => component.get('a').trigger('click'))
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
        .mount(FormVersionDefDropdown, mountOptions({
          props: { version: draft }
        }))
        .request(component => component.get('a').trigger('click'))
        .beforeEachResponse((_, { method, url }) => {
          method.should.equal('GET');
          url.should.equal('/v1/projects/1/forms/f/draft.xml');
        })
        .respondWithData(() => '<x/>');
    });

    it('stores the XML', () => {
      const form = testData.extendedForms.createPast(1).last();
      return mockHttp()
        .mount(FormVersionDefDropdown, mountOptions({
          props: { version: form }
        }))
        .request(component => component.get('a').trigger('click'))
        .respondWithData(() => '<x/>')
        .afterResponse(dropdown => {
          dropdown.vm.formVersionXml.data.should.equal('<x/>');
        });
    });

    it('emits an event', () => {
      const form = testData.extendedForms.createPast(1).last();
      return mockHttp()
        .mount(FormVersionDefDropdown, mountOptions({
          props: { version: form }
        }))
        .request(dropdown => dropdown.get('a').trigger('click'))
        .beforeAnyResponse(dropdown => {
          dropdown.emitted('view-xml').length.should.equal(1);
        })
        .respondWithData(() => '<x/>');
    });
  });

  describe('download XML', () => {
    it('shows the correct text', () => {
      const form = testData.extendedForms.createPast(1).last();
      const dropdown = mount(FormVersionDefDropdown, mountOptions({
        props: { version: form }
      }));
      dropdown.findAll('a')[1].text().should.equal('Download as XForm (.xml)');
    });

    it('has the correct href attribute for a published version', () => {
      const form = testData.extendedForms.createPast(1).last();
      const dropdown = mount(FormVersionDefDropdown, mountOptions({
        props: { version: form }
      }));
      const { href } = dropdown.findAll('a')[1].attributes();
      href.should.equal('/v1/projects/1/forms/f/versions/v1.xml');
    });

    it('has the correct href attribute for a draft', () => {
      testData.extendedForms.createPast(1, { draft: true });
      const draft = testData.extendedFormDrafts.last();
      const dropdown = mount(FormVersionDefDropdown, mountOptions({
        props: { version: draft }
      }));
      const { href } = dropdown.findAll('a')[1].attributes();
      href.should.equal('/v1/projects/1/forms/f/draft.xml');
    });

    it('has the correct download attribute', () => {
      const form = testData.extendedForms.createPast(1).last();
      const dropdown = mount(FormVersionDefDropdown, mountOptions({
        props: { version: form }
      }));
      dropdown.findAll('a')[1].attributes().download.should.equal('f.xml');
    });
  });

  describe('download XLSForm', () => {
    it('renders a download link for a version with an XLSForm', () => {
      const form = testData.extendedForms
        .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
        .last();
      const dropdown = mount(FormVersionDefDropdown, mountOptions({
        props: { version: form }
      }));
      dropdown.findAll('a').length.should.equal(3);
    });

    it('does not render a download link for a version without an XLSForm', () => {
      const form = testData.extendedForms
        .createPast(1, { excelContentType: null })
        .last();
      const dropdown = mount(FormVersionDefDropdown, mountOptions({
        props: { version: form }
      }));
      dropdown.findAll('a').length.should.equal(2);
    });

    describe('.xls file', () => {
      it('shows the correct text', () => {
        const form = testData.extendedForms
          .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
          .last();
        const dropdown = mount(FormVersionDefDropdown, mountOptions({
          props: { version: form }
        }));
        const text = dropdown.findAll('a')[2].text();
        text.should.equal('Download as XLSForm (.xls)');
      });

      it('has the correct href attribute for a published version', () => {
        const form = testData.extendedForms
          .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
          .last();
        const dropdown = mount(FormVersionDefDropdown, mountOptions({
          props: { version: form }
        }));
        const { href } = dropdown.findAll('a')[2].attributes();
        href.should.equal('/v1/projects/1/forms/f/versions/v1.xls');
      });

      it('has the correct href attribute for a draft', () => {
        testData.extendedForms.createPast(1, {
          draft: true,
          excelContentType: 'application/vnd.ms-excel'
        });
        const draft = testData.extendedFormDrafts.last();
        const dropdown = mount(FormVersionDefDropdown, mountOptions({
          props: { version: draft }
        }));
        const { href } = dropdown.findAll('a')[2].attributes();
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
        const dropdown = mount(FormVersionDefDropdown, mountOptions({
          props: { version: form }
        }));
        const text = dropdown.findAll('a')[2].text();
        text.should.equal('Download as XLSForm (.xlsx)');
      });

      it('has the correct href attribute for a published version', () => {
        const form = testData.extendedForms
          .createPast(1, {
            excelContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
          .last();
        const dropdown = mount(FormVersionDefDropdown, mountOptions({
          props: { version: form }
        }));
        const { href } = dropdown.findAll('a')[2].attributes();
        href.should.equal('/v1/projects/1/forms/f/versions/v1.xlsx');
      });

      it('has the correct href attribute for a draft', () => {
        testData.extendedForms.createPast(1, {
          draft: true,
          excelContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const draft = testData.extendedFormDrafts.last();
        const dropdown = mount(FormVersionDefDropdown, mountOptions({
          props: { version: draft }
        }));
        const { href } = dropdown.findAll('a')[2].attributes();
        href.should.equal('/v1/projects/1/forms/f/draft.xlsx');
      });
    });
  });
});
