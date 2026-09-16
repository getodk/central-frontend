import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import {
  bind,
  body,
  head,
  html,
  input,
  item,
  mainInstance,
  model,
  select1,
  setvalue,
  t,
  title,
  upload,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { JRResourceURL, type JRResourceURLString, } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { UploadNode } from '@getodk/xforms-engine';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { JRResource } from '../../scenario/fixtures/JRResource.ts';
import { JRResourceService } from '../../scenario/fixtures/JRResourceService.ts';
import { Scenario } from '../../scenario/jr/Scenario.ts';

describe('Instance attachments with calculate and setvalue', () => {
  const KOALA_URL = 'jr://images/koala.jpg';
  const BEAR_URL = 'jr://images/bear.jpg';
  const FAKE_INSTANCE_ID = 'not important to this suite';
  const CALCULATED_PHOTO = `if(/data/animal != '', concat('jr://images/', /data/animal, '.jpg'), '')`;
  let resourceService: JRResourceService;

  interface Deferred<T> {
    readonly promise: Promise<T>;
    readonly resolve: (value: T) => void;
  }

  const createDeferred = <T>(): Deferred<T> => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((resolvePromise) => {
      resolve = resolvePromise;
    });
    return { promise, resolve };
  };

  const activateImage = (
    service: JRResourceService,
    url: JRResourceURLString,
    data: Promise<string> | string
  ) => {
    const resource = new JRResource({
      url: JRResourceURL.from(url),
      fileName: url.slice(url.lastIndexOf('/') + 1),
      mimeType: 'image/jpeg',
      load: () => Promise.resolve(data),
    });
    service.resources.set(url, resource);
  };

  const getUploadNode = (scenario: Scenario, reference: string): UploadNode => {
    const node = scenario.getInstanceNode(reference);
    assert(node.nodeType === 'upload');
    return node;
  };

  const settle = async (node: UploadNode): Promise<void> => {
    await vi.waitFor(() => expect(node.currentState.attachmentState.loading).toBe(false));
  };

  const getPayloadAttachments = async (scenario: Scenario): Promise<Map<string, File>> => {
    const { data } = await scenario.prepareWebFormsInstancePayload();
    const [payloadFiles] = data;
    return new Map(
      Array.from(payloadFiles).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
    );
  };

  const animalPhotoForm = (photoBind: XFormsElement, ...modelChildren: XFormsElement[]) => {
    // prettier-ignore
    return html(
      head(
        title('Animal photo'),
        model(
          mainInstance(
            t('data id="animal-photo"',
              t('animal'),
              t('photo'),
              t('meta',
                t('instanceID', FAKE_INSTANCE_ID)))),
          bind('/data/animal').type('string'),
          photoBind,
          ...modelChildren)),
      body(
        select1('/data/animal',
          item('koala', 'Koala'),
          item('bear', 'Bear'),
          item('none', 'None')),
        upload('/data/photo')));
  };

  beforeEach(() => {
    resourceService = new JRResourceService();
    activateImage(resourceService, KOALA_URL, 'koala');
    activateImage(resourceService, BEAR_URL, 'bear');
  });

  afterEach(() => {
    resourceService.reset();
  });

  describe('calculate', () => {
    let scenario: Scenario;
    let photo: UploadNode;

    beforeEach(async () => {
      scenario = await Scenario.init(
        'Calculated photo',
        animalPhotoForm(bind('/data/photo').type('binary').calculate(CALCULATED_PHOTO)),
        { resourceService }
      );
      photo = getUploadNode(scenario, '/data/photo');
    });

    it('resolves a jr:// reference to the form attachment and serializes it without an upload', async () => {
      expect(photo.currentState.instanceValue).toBe('');
      expect(photo.currentState.value).toBeNull();
      expect(photo.currentState.attachmentState.loading).toBe(false);

      scenario.answer('/data/animal', 'koala');

      expect(photo.currentState.instanceValue).toBe(KOALA_URL);
      await settle(photo);

      const file = photo.currentState.value;
      assert(file != null);
      expect(file.name).toBe(KOALA_URL);
      expect(file.type).toBe('image/jpeg');
      expect(await getBlobText(file)).toBe('koala');
      expect(photo.currentState.attachmentState.dirty).toBe(false);
      expect(photo.currentState.attachmentState.loadingError).toBe(false);
      expect(scenario).toHaveSerializedSubmissionXML(
        // prettier-ignore
        t('data id="animal-photo"',
          t('animal', 'koala'),
          t('photo', KOALA_URL),
          t('meta',
            t('instanceID', FAKE_INSTANCE_ID))).asXml()
      );
      expect((await getPayloadAttachments(scenario)).size).toBe(0);
    });

    it('replaces the file when the calculation changes and clears it when blank', async () => {
      scenario.answer('/data/animal', 'koala');
      await settle(photo);
      scenario.answer('/data/animal', 'bear');
      await settle(photo);

      expect(photo.currentState.instanceValue).toBe(BEAR_URL);
      expect(await getBlobText(photo.currentState.value!)).toBe('bear');

      scenario.answer('/data/animal', '');

      expect(photo.currentState.instanceValue).toBe('');
      expect(photo.currentState.value).toBeNull();
      expect(photo.currentState.attachmentState.loading).toBe(false);
    });

    it('keeps the latest reference when an earlier fetch resolves later', async () => {
      resourceService.reset();
      const koala = createDeferred<string>();
      activateImage(resourceService, KOALA_URL, koala.promise);
      activateImage(resourceService, BEAR_URL, 'bear');

      scenario.answer('/data/animal', 'koala');
      expect(photo.currentState.attachmentState.loading).toBe(true);

      scenario.answer('/data/animal', 'bear');
      await settle(photo);
      koala.resolve('koala');
      await koala.promise;

      expect(photo.currentState.instanceValue).toBe(BEAR_URL);
      expect(await getBlobText(photo.currentState.value!)).toBe('bear');
    });

    it('keeps a client upload over the calculated file until the calculation changes', async () => {
      scenario.answer('/data/animal', 'koala');
      await settle(photo);

      const uploaded = new File(['mine'], 'mine.jpg', { type: 'image/jpeg' });
      scenario.answer('/data/photo', uploaded);

      expect(photo.currentState.instanceValue).toBe('mine.jpg');
      expect(photo.currentState.attachmentState.dirty).toBe(true);
      expect((await getPayloadAttachments(scenario)).get('mine.jpg')).not.toBeNull();

      scenario.answer('/data/animal', 'bear');
      await settle(photo);

      expect(photo.currentState.instanceValue).toBe(BEAR_URL);
      expect(photo.currentState.attachmentState.dirty).toBe(false);
      expect((await getPayloadAttachments(scenario)).size).toBe(0);

      scenario.answer('/data/photo', uploaded);
      scenario.answer('/data/animal', '');

      expect(photo.currentState.instanceValue).toBe('');
      expect(photo.currentState.value).toBeNull();
    });

    it('re-runs the calculation over a client upload when editing', async () => {
      scenario.answer('/data/animal', 'koala');
      await settle(photo);
      scenario.answer('/data/photo', new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }));

      const edited = await scenario.editCurrentInstance();
      const editedPhoto = getUploadNode(edited, '/data/photo');
      await settle(editedPhoto);

      expect(editedPhoto.currentState.instanceValue).toBe(KOALA_URL);
      expect(await getBlobText(editedPhoto.currentState.value!)).toBe('koala');
      expect((await getPayloadAttachments(edited)).size).toBe(0);
    });

    it('reports a loading error for a missing form attachment and recovers on retry', async () => {
      resourceService.reset();

      scenario.answer('/data/animal', 'koala');
      await settle(photo);

      expect(photo.currentState.instanceValue).toBe(KOALA_URL);
      expect(photo.currentState.value).toBeNull();
      expect(photo.currentState.attachmentState.loadingError).toBe('network-error');

      activateImage(resourceService, KOALA_URL, 'koala');
      photo.retryFetch();
      await settle(photo);

      expect(photo.currentState.attachmentState.loadingError).toBe(false);
      expect(await getBlobText(photo.currentState.value!)).toBe('koala');
    });

    it('reports not-found for a reference which is not a form attachment', async () => {
      const plainScenario = await Scenario.init(
        'Plain reference',
        animalPhotoForm(bind('/data/photo').type('binary').calculate(`'photo.jpg'`)),
        { resourceService }
      );
      const plainPhoto = getUploadNode(plainScenario, '/data/photo');
      await settle(plainPhoto);

      expect(plainPhoto.currentState.instanceValue).toBe('photo.jpg');
      expect(plainPhoto.currentState.attachmentState.loadingError).toBe('not-found');
    });
  });

  describe('relevance', () => {
    let scenario: Scenario;
    let photo: UploadNode;

    beforeEach(async () => {
      scenario = await Scenario.init(
        'Relevant photo',
        animalPhotoForm(
          bind('/data/photo')
            .type('binary')
            .calculate(`'${KOALA_URL}'`)
            .relevant(`/data/animal != 'none'`)
        ),
        { resourceService }
      );
      photo = getUploadNode(scenario, '/data/photo');
      await settle(photo);
    });

    it('blanks a client upload while non-relevant and recalculates when restored', async () => {
      scenario.answer('/data/photo', new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }));
      scenario.answer('/data/animal', 'none');

      expect(photo.currentState.instanceValue).toBe('');
      expect(photo.currentState.value).toBeNull();
      expect((await getPayloadAttachments(scenario)).size).toBe(0);

      scenario.answer('/data/animal', 'koala');
      await settle(photo);

      expect(photo.currentState.instanceValue).toBe(KOALA_URL);
      expect(photo.currentState.attachmentState.dirty).toBe(false);
      expect(await getBlobText(photo.currentState.value!)).toBe('koala');
    });

    it('restores a client upload when relevance is restored', async () => {
      const uploadScenario = await Scenario.init(
        'Relevant upload',
        animalPhotoForm(bind('/data/photo').type('binary').relevant(`/data/animal != 'none'`)),
        { resourceService }
      );
      const uploadPhoto = getUploadNode(uploadScenario, '/data/photo');

      uploadScenario.answer('/data/photo', new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }));
      uploadScenario.answer('/data/animal', 'none');

      expect(uploadPhoto.currentState.instanceValue).toBe('');
      expect(uploadPhoto.currentState.value).toBeNull();

      uploadScenario.answer('/data/animal', 'koala');

      expect(uploadPhoto.currentState.instanceValue).toBe('mine.jpg');
      expect(uploadPhoto.currentState.attachmentState.dirty).toBe(true);
      expect(await getBlobText(uploadPhoto.currentState.value!)).toBe('mine');
    });
  });

  describe('readonly', () => {
    it('accepts the calculation and rejects client writes', async () => {
      const scenario = await Scenario.init(
        'Readonly photo',
        animalPhotoForm(
          bind('/data/photo').type('binary').calculate(`'${KOALA_URL}'`).readonly('true()')
        ),
        { resourceService }
      );
      const photo = getUploadNode(scenario, '/data/photo');
      await settle(photo);

      expect(photo.currentState.instanceValue).toBe(KOALA_URL);
      expect(() => {
        scenario.answer('/data/photo', new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }));
      }).toThrow('Cannot write to readonly field');
      expect(photo.currentState.instanceValue).toBe(KOALA_URL);
    });
  });

  describe('setvalue', () => {
    it('sets a jr:// reference on odk-instance-first-load, once', async () => {
      const scenario = await Scenario.init(
        'First load photo',
        animalPhotoForm(
          bind('/data/photo').type('binary'),
          setvalue('odk-instance-first-load', '/data/photo', `'${KOALA_URL}'`)
        ),
        { resourceService }
      );
      const photo = getUploadNode(scenario, '/data/photo');
      await settle(photo);

      expect(photo.currentState.instanceValue).toBe(KOALA_URL);
      expect(await getBlobText(photo.currentState.value!)).toBe('koala');

      scenario.answer('/data/photo', new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }));
      const edited = await scenario.editCurrentInstance();
      const editedPhoto = getUploadNode(edited, '/data/photo');
      await settle(editedPhoto);

      expect(editedPhoto.currentState.instanceValue).toBe('mine.jpg');
      expect(await getBlobText(editedPhoto.currentState.value!)).toBe('mine');
    });

    it('sets a jr:// reference on odk-instance-load, on every load', async () => {
      const scenario = await Scenario.init(
        'Load photo',
        animalPhotoForm(
          bind('/data/photo').type('binary'),
          setvalue('odk-instance-load', '/data/photo', `'${KOALA_URL}'`)
        ),
        { resourceService }
      );
      scenario.answer('/data/photo', new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }));

      const edited = await scenario.editCurrentInstance();
      const editedPhoto = getUploadNode(edited, '/data/photo');
      await settle(editedPhoto);

      expect(editedPhoto.currentState.instanceValue).toBe(KOALA_URL);
    });

    it('targets an upload node from xforms-value-changed', async () => {
      const scenario = await Scenario.init(
        'Value changed photo',
        // prettier-ignore
        html(
          head(
            title('Value changed photo'),
            model(
              mainInstance(
                t('data id="value-changed-photo"',
                  t('animal'),
                  t('photo'))),
              bind('/data/animal').type('string'),
              bind('/data/photo').type('binary'))),
          body(
            input('/data/animal',
              setvalue('xforms-value-changed', '/data/photo', `concat('jr://images/', /data/animal, '.jpg')`)),
            upload('/data/photo'))),
        { resourceService }
      );
      const photo = getUploadNode(scenario, '/data/photo');

      expect(photo.currentState.instanceValue).toBe('');

      scenario.answer('/data/animal', 'bear');
      await settle(photo);

      expect(photo.currentState.instanceValue).toBe(BEAR_URL);
      expect(await getBlobText(photo.currentState.value!)).toBe('bear');
    });

    it('triggers xforms-value-changed from an upload node', async () => {
      const scenario = await Scenario.init(
        'Photo name',
        // prettier-ignore
        html(
          head(
            title('Photo name'),
            model(
              mainInstance(
                t('data id="photo-name"',
                  t('photo'),
                  t('photo_name'))),
              bind('/data/photo').type('binary'),
              bind('/data/photo_name').type('string'))),
          body(
            upload('/data/photo',
              setvalue('xforms-value-changed', '/data/photo_name', '/data/photo')),
            input('/data/photo_name'))),
        { resourceService }
      );

      scenario.answer('/data/photo', new File(['mine'], 'mine.jpg', { type: 'image/jpeg' }));
      expect(scenario.answerOf('/data/photo_name').stringValue).toBe('mine.jpg');

      scenario.answer('/data/photo', null);
      expect(scenario.answerOf('/data/photo_name').stringValue).toBe('');
    });
  });
});
