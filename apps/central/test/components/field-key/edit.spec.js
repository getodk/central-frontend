import ActorPropertiesUpsert from '../../../src/components/actor-properties/upsert.vue';
import FieldKeyEdit from '../../../src/components/field-key/edit.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { testRequestData } from '../../util/request-data';

const mountOptions = (options = undefined) => {
  const fieldKey = testData.extendedFieldKeys.last();
  return mergeMountOptions(options, {
    props: { state: true, fieldKey },
    container: {
      requestData: testRequestData(['actorProperties'], {
        project: testData.extendedProjects.last(),
        actorProperties: [{ name: 'prop1' }, { name: 'prop2' }]
      })
    }
  });
};

describe('FieldKeyEdit', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedFieldKeys.createPast(1, {
      displayName: 'My App User',
      properties: { prop1: 'value1', prop2: 'value2' }
    });
  });

  it('shows the display name', () => {
    const modal = mount(FieldKeyEdit, mountOptions());
    const intro = modal.get('.modal-introduction');
    intro.text().should.include('My App User');
  });

  it('renders ActorPropertiesUpsert with property definitions', () => {
    const modal = mount(FieldKeyEdit, mountOptions());
    const upsert = modal.getComponent(ActorPropertiesUpsert);
    upsert.props().propertyDefs.should.eql([{ name: 'prop1' }, { name: 'prop2' }]);
  });

  it('initializes property values from the field key', async () => {
    const modal = mount(FieldKeyEdit, mountOptions({ props: { state: false } }));
    await modal.setProps({ state: true });
    const textareas = modal.findAll('textarea');
    textareas[0].element.value.should.equal('value1');
    textareas[1].element.value.should.equal('value2');
  });

  it('sends the correct request', () => {
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return load('/projects/1/app-users')
      .complete()
      .request(async (app) => {
        await app.get('.field-key-row .edit-button').trigger('click');
        const modal = app.get('#field-key-edit');
        const textareas = modal.findAll('textarea');
        await textareas[0].setValue('newValue1');
        return modal.get('.btn-primary').trigger('click');
      })
      .beforeEachResponse((_, { method, url, data }, i) => {
        if (i === 0) {
          method.should.equal('PATCH');
          url.should.equal('/v1/projects/1/app-users/1');
          data.should.have.property('properties');
          data.properties.prop1.should.equal('newValue1');
        }
      })
      .respondWithData(() => testData.extendedFieldKeys.last())
      .respondWithData(() => testData.extendedFieldKeys.sorted());
  });

  it('hides the edit button if there are no actor properties', async () => {
    const app = await load('/projects/1/app-users');
    app.find('.field-key-row .edit-button').exists().should.be.false;
  });

  it('shows a success message', () => {
    testData.actorProperties.createPast(1, { name: 'prop1' });
    return load('/projects/1/app-users')
      .complete()
      .request(async (app) => {
        await app.get('.field-key-row .edit-button').trigger('click');
        return app.get('#field-key-edit .btn-primary').trigger('click');
      })
      .respondWithData(() => testData.extendedFieldKeys.last())
      .respondWithData(() => testData.extendedFieldKeys.sorted())
      .afterResponses(app => {
        app.should.alert('success', 'The App User “My App User” was updated successfully.');
      });
  });
});
