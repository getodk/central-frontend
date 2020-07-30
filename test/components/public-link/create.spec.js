import PublicLinkCreate from '../../../src/components/public-link/create.vue';
import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountComponent = (options) => mount(PublicLinkCreate, {
  ...options,
  propsData: { state: true },
  requestData: { form: testData.extendedForms.last() }
});
const mockHttpForComponent = (mountOptions) => mockHttp()
  .mount(PublicLinkCreate, {
    ...mountOptions,
    propsData: { state: true },
    requestData: { form: testData.extendedForms.last() }
  });

describe('PublicLinkCreate', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('toggles the modal', () =>
    load('/projects/1/forms/f/public-links', { component: true }, {})
      .testModalToggles(
        PublicLinkCreate,
        '.heading-with-button .btn-primary',
        '.btn-link'
      ));

  it('focuses the display name input', () => {
    const modal = mountComponent({ attachToDocument: true });
    modal.first('input').should.be.focused();
  });

  it('resets the form after the modal is hidden', async () => {
    const app = await load('/projects/1/forms/f/public-links', { component: true }, {});
    await trigger.click(app, '.heading-with-button .btn-primary');
    const modal = app.first(PublicLinkCreate);
    await trigger.fillForm(modal, [
      ['input', 'My Public Link'],
      ['input[type="checkbox"]', true]
    ]);
    await trigger.click(modal, '.btn-link');
    await trigger.click(app, '.heading-with-button .btn-primary');
    modal.first('input').element.value.should.equal('');
    modal.first('input[type="checkbox"]').element.checked.should.be.false();
  });

  describe('request', () => {
    it('sends the correct request', () =>
      mockHttpForComponent()
        .request(trigger.submit('form', [['input', 'My Public Link']]))
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('POST');
          url.should.equal('/v1/projects/1/forms/f/public-links');
          data.should.eql({ displayName: 'My Public Link', once: true });
        })
        .respondWithProblem());

    it('sends the correct once property if the checkbox is checked', () =>
      mockHttpForComponent()
        .request(trigger.submit('form', [
          ['input', 'My Public Link'],
          ['input[type="checkbox"]', true]
        ]))
        .beforeEachResponse((_, { data }) => {
          data.once.should.be.false();
        })
        .respondWithProblem());
  });

  it('implements some standard button things', () =>
    mockHttpForComponent()
      .testStandardButton({
        button: '.btn-primary',
        request: trigger.submit('form', [['input', 'My Public Link']]),
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const submit = () => {
      testData.standardPublicLinks.createPast(1);
      return load('/projects/1/forms/f/public-links', { component: true }, {})
        .complete()
        .request(async (app) => {
          await trigger.click(app, '.heading-with-button .btn-primary');
          await trigger.submit(app, '#public-link-create form', [
            ['input', 'My Public Link']
          ]);
        })
        .respondWithData(() => testData.standardPublicLinks.createNew({
          displayName: 'My Public Link'
        }))
        .respondWithData(() => testData.standardPublicLinks.sorted());
    };

    it('hides the modal', async () => {
      const app = await submit();
      app.first(PublicLinkCreate).getProp('state').should.be.false();
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });

    it('updates the number of rows', async () => {
      const app = await submit();
      app.find('.public-link-row').length.should.equal(2);
    });

    it('highlights the new public link', async () => {
      const app = await submit();
      app.first('.public-link-row').hasClass('success').should.be.true();
    });
  });
});
