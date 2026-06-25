import ActorPropertiesUpsert from '../../../src/components/actor-properties/upsert.vue';
import PublicLinkEdit from '../../../src/components/public-link/edit.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => {
  const publicLink = testData.extendedPublicLinks.last();
  return mergeMountOptions(options, {
    props: { state: true, publicLink },
    container: {
      requestData: testRequestData(['actorProperties'], {
        form: testData.extendedForms.last(),
        actorProperties: [{ name: 'prop1' }, { name: 'prop2' }]
      })
    }
  });
};

describe('PublicLinkEdit', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedPublicLinks.createPast(1, {
      displayName: 'My Public Link',
      properties: { prop1: 'value1', prop2: 'value2' }
    });
  });

  it('shows the display name in the title', () => {
    const modal = mount(PublicLinkEdit, mountOptions());
    const title = modal.get('.modal-title');
    title.text().should.include('My Public Link');
  });

  it('renders ActorPropertiesUpsert with property definitions', () => {
    const modal = mount(PublicLinkEdit, mountOptions());
    const upsert = modal.getComponent(ActorPropertiesUpsert);
    upsert.props().propertyDefs.should.eql([{ name: 'prop1' }, { name: 'prop2' }]);
  });

  it('initializes property values from the field key', async () => {
    const modal = mount(PublicLinkEdit, mountOptions({ props: { state: false } }));
    await modal.setProps({ state: true });
    const textareas = modal.findAll('textarea');
    textareas[0].element.value.should.equal('value1');
    textareas[1].element.value.should.equal('value2');
  });

  it('sends the correct request', () => {
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return load('/projects/1/forms/f/public-links')
      .complete()
      .request(async (app) => {
        await app.get('.public-link-row .edit-button').trigger('click');
        const modal = app.get('#public-link-edit');
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('newValue1');
        return modal.get('.btn-primary').trigger('click');
      })
      .beforeEachResponse((_, { method, url, data }, i) => {
        if (i === 0) {
          method.should.equal('PATCH');
          url.should.equal('/v1/projects/1/forms/f/public-links/1');
          data.should.deep.equal({ properties: { prop1: 'newValue1' } });
        }
      })
      .respondWithData(() => testData.extendedPublicLinks.last())
      .respondWithData(() => testData.extendedPublicLinks.sorted());
  });

  it('hides the edit button if there are no actor properties', async () => {
    const app = await load('/projects/1/forms/f/public-links');
    app.find('.public-link-row .edit-button').exists().should.be.false;
  });

  it('shows a success message', () => {
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return load('/projects/1/forms/f/public-links')
      .complete()
      .request(async (app) => {
        await app.get('.public-link-row .edit-button').trigger('click');
        return app.get('#public-link-edit .btn-primary').trigger('click');
      })
      .respondWithData(() => testData.extendedPublicLinks.last())
      .respondWithData(() => testData.extendedPublicLinks.sorted())
      .afterResponses(app => {
        app.should.alert('success', 'The Public Access Link “My Public Link” was updated successfully.');
      });
  });
});
