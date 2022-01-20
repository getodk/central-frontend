import PublicLinkCreate from '../../../src/components/public-link/create.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { state: true },
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});

describe('PublicLinkCreate', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('toggles the modal', () =>
    load('/projects/1/forms/f/public-links', { root: false }).testModalToggles({
      modal: PublicLinkCreate,
      show: '.heading-with-button .btn-primary',
      hide: '.btn-link'
    }));

  it('focuses the display name input', () => {
    const modal = mount(PublicLinkCreate, mountOptions({
      attachTo: document.body
    }));
    modal.get('input').should.be.focused();
  });

  it('resets the form after the modal is hidden', async () => {
    const modal = mount(PublicLinkCreate, mountOptions());
    await modal.get('input').setValue('My Public Link');
    await modal.get('input[type="checkbox"]').setChecked();
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.get('input').element.value.should.equal('');
    modal.get('input[type="checkbox"]').element.checked.should.be.false();
  });

  describe('request', () => {
    it('sends the correct request', () =>
      mockHttp()
        .mount(PublicLinkCreate, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My Public Link');
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms/f/public-links');
          data.should.eql({ displayName: 'My Public Link', once: false });
        })
        .respondWithProblem());

    it('sends the correct once property if the checkbox is checked', () =>
      mockHttp()
        .mount(PublicLinkCreate, mountOptions())
        .request(async (modal) => {
          await modal.get('input').setValue('My Public Link');
          await modal.get('input[type="checkbox"]').setChecked();
          return modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { data }) => {
          data.once.should.be.true();
        })
        .respondWithProblem());
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(PublicLinkCreate, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        request: async (modal) => {
          await modal.get('input').setValue('My Public Link');
          return modal.get('form').trigger('submit');
        },
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const submit = () => {
      testData.standardPublicLinks.createPast(1);
      return load('/projects/1/forms/f/public-links', { root: false })
        .complete()
        .request(async (app) => {
          await app.get('.heading-with-button .btn-primary').trigger('click');
          const modal = app.getComponent(PublicLinkCreate);
          await modal.get('input').setValue('My Public Link');
          return modal.get('form').trigger('submit');
        })
        .respondWithData(() => testData.standardPublicLinks.createNew({
          displayName: 'My Public Link'
        }))
        .respondWithData(() => testData.standardPublicLinks.sorted());
    };

    it('hides the modal', async () => {
      const app = await submit();
      app.getComponent(PublicLinkCreate).props().state.should.be.false();
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });

    it('updates the number of rows', async () => {
      const app = await submit();
      app.findAll('.public-link-row').length.should.equal(2);
    });

    it('highlights the new public link', async () => {
      const app = await submit();
      app.get('.public-link-row').classes('success').should.be.true();
    });
  });
});
