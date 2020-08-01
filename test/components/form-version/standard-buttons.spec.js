import EnketoPreview from '../../../src/components/enketo/preview.vue';
import Form from '../../../src/presenters/form';
import FormVersionStandardButtons from '../../../src/components/form-version/standard-buttons.vue';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = ({ version, preview = false }) =>
  mount(FormVersionStandardButtons, {
    propsData: { version: new Form(version), preview }
  });

describe('FormVersionStandardButtons', () => {
  describe('form version without an XLSForm', () => {
    it('shows one link', () => {
      const form = testData.extendedForms.createPast(1).last();
      mountComponent({ version: form }).find('a').length.should.equal(1);
    });

    it('has the correct href attribute for a published version', () => {
      const form = testData.extendedForms.createPast(1).last();
      const href = mountComponent({ version: form }).first('a').getAttribute('href');
      href.should.equal('/v1/projects/1/forms/f/versions/v1.xml');
    });

    it('has the correct href attribute for a draft', () => {
      testData.extendedForms.createPast(1, { draft: true });
      const draft = testData.extendedFormDrafts.last();
      const component = mountComponent({ version: draft });
      const href = component.first('a').getAttribute('href');
      href.should.equal('/v1/projects/1/forms/f/draft.xml');
    });

    it('has the correct download attribute', () => {
      const form = testData.extendedForms.createPast(1).last();
      const component = mountComponent({ version: form });
      component.first('a').getAttribute('download').should.equal('f.xml');
    });
  });

  describe('form version with an XLSForm', () => {
    it('shows two links', () => {
      const form = testData.extendedForms
        .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
        .last();
      mountComponent({ version: form }).find('a').length.should.equal(2);
    });

    describe('link to download the XForm', () => {
      it('has the correct href attribute for a published version', () => {
        const form = testData.extendedForms
          .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
          .last();
        const href = mountComponent({ version: form }).first('a').getAttribute('href');
        href.should.equal('/v1/projects/1/forms/f/versions/v1.xml');
      });

      it('has the correct href attribute for a draft', () => {
        testData.extendedForms.createPast(1, {
          draft: true,
          excelContentType: 'application/vnd.ms-excel'
        });
        const component = mountComponent({ version: testData.extendedFormDrafts.last() });
        const href = component.first('a').getAttribute('href');
        href.should.equal('/v1/projects/1/forms/f/draft.xml');
      });

      it('has the correct download attribute', () => {
        const form = testData.extendedForms
          .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
          .last();
        const component = mountComponent({ version: form });
        component.first('a').getAttribute('download').should.equal('f.xml');
      });
    });

    describe('link to download the XLSForm', () => {
      describe('.xls file', () => {
        it('shows the correct text', () => {
          const form = testData.extendedForms
            .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
            .last();
          const text = mountComponent({ version: form }).find('a')[1].text().trim();
          text.should.equal('As XLSForm (.xls)');
        });

        it('has the correct href attribute for a published version', () => {
          const form = testData.extendedForms
            .createPast(1, { excelContentType: 'application/vnd.ms-excel' })
            .last();
          const href = mountComponent({ version: form }).find('a')[1].getAttribute('href');
          href.should.equal('/v1/projects/1/forms/f/versions/v1.xls');
        });

        it('has the correct href attribute for a draft', () => {
          testData.extendedForms.createPast(1, {
            draft: true,
            excelContentType: 'application/vnd.ms-excel'
          });
          const draft = testData.extendedFormDrafts.last();
          const component = mountComponent({ version: draft });
          const href = component.find('a')[1].getAttribute('href');
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
          const text = mountComponent({ version: form }).find('a')[1].text().trim();
          text.should.equal('As XLSForm (.xlsx)');
        });

        it('has the correct href attribute for a published version', () => {
          const form = testData.extendedForms
            .createPast(1, {
              excelContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            .last();
          const component = mountComponent({ version: form });
          const href = component.find('a')[1].getAttribute('href');
          href.should.equal('/v1/projects/1/forms/f/versions/v1.xlsx');
        });

        it('has the correct href attribute for a draft', () => {
          testData.extendedForms.createPast(1, {
            draft: true,
            excelContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const draft = testData.extendedFormDrafts.last();
          const component = mountComponent({ version: draft });
          const href = component.find('a')[1].getAttribute('href');
          href.should.equal('/v1/projects/1/forms/f/draft.xlsx');
        });
      });
    });
  });

  describe('preview button', () => {
    it('shows the button if the preview prop is true', () => {
      const form = testData.extendedForms.createPast(1).last();
      const component = mountComponent({ version: form, preview: true });
      component.first(EnketoPreview).should.be.visible();
    });

    it('does not render the button if the preview prop is false', () => {
      const form = testData.extendedForms.createPast(1).last();
      const component = mountComponent({ version: form, preview: false });
      component.find(EnketoPreview).length.should.equal(0);
    });
  });
});
