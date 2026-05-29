import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import {
  bind,
  body,
  head,
  html,
  input,
  label,
  mainInstance,
  model,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('Form submission encryption', () => {
  const DEFAULT_INSTANCE_ID = 'uuid:TODO-mock-xpath-functions';
  const BASE64_RSA_PUBLIC_KEY =
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwkP+HQEqkyb4HPLOekvn6imYW6Ze2dF2sLCspnzimOnbiF7C1mcd01xiau+9WgU23kM35URhBQVbDHtbQMgZL/Ol+xdA0zdbcUW00Z7EkYmM4sGu4wwJA2eQ6yhBbY2np+kDTvmVHlhP8DDYsXJKqtm+8bXlI36qjVgkVPXjT9YNAA4vRxPReP5wuXHrMGjclPyU6SlFZZm8QLknYV9cmGh1CquKxK7/hIoGIZ3j+edh2GZg8XJo3ZkgAwOwNUqF9b4kXw+tnbpqLXfcETX3fp6iXqLqNMt3E1MXXMnePfDqsa9wrcykUMKfxLXF/EyhIZ+2+iBoyRKeIkExwJRMdQIDAQAB';

  interface BuildSubmissionPayloadScenario {
    readonly version: string | null;
  }

  const buildSubmissionPayloadScenario = async (
    options: BuildSubmissionPayloadScenario
  ): Promise<Scenario> => {
    const { version } = options;
    const versionAttribute = version ? ` version="${version}"` : '';
    return await Scenario.init(
      'My secret form',
      html(
        head(
          title('My secret form'),
          model(
            mainInstance(
              t(
                'data id="my-secret-form"' + versionAttribute,
                t('inp', 'test'),
                t('meta', t('instanceID'))
              )
            ),
            t(`submission base64RsaPublicKey="${BASE64_RSA_PUBLIC_KEY}"`),
            bind('/data/inp').required(),
            bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
          )
        ),
        body(input('/data/inp', label('inp')))
      )
    );
  };

  describe('generates an encrypted submission with a submission metadata file and an encoded attachment', () => {
    it.each([
      { includeVersion: false, name: 'without a version' },
      { includeVersion: true, name: 'with a version' },
    ])('$name', async ({ includeVersion }) => {
      const version = includeVersion ? '53148686512' : null;
      const scenario = await buildSubmissionPayloadScenario({ version });
      const userEnteredValue = 'secret value';
      scenario.answer('/data/inp', userEnteredValue);
      const submissionResult = await scenario.prepareWebFormsInstancePayload();

      expect(submissionResult.submissionMeta).toMatchObject({
        encryptionKey: BASE64_RSA_PUBLIC_KEY,
      });

      expect(submissionResult.data.length).to.equal(1);
      const entries = submissionResult.data[0].entries();

      const [submissionFilename, file] = entries.next().value!;
      expect(submissionFilename).to.equal('xml_submission_file');
      const submission = await getBlobText(file);
      const expectedVersionAttribute = version ? ` version="${version}"` : '';
      expect(submission).to.contain(
        `<data xmlns="http://www.opendatakit.org/xforms/encrypted" encrypted="yes" id="my-secret-form"${expectedVersionAttribute}>`
      );
      expect(submission).to.match(/<base64EncryptedKey>.*<\/base64EncryptedKey>/);
      expect(submission).to.contain('<encryptedXmlFile>submission.xml.enc</encryptedXmlFile>');
      expect(submission).to.contain(
        '<meta xmlns="http://openrosa.org/xforms"><instanceID>uuid:TODO-mock-xpath-functions</instanceID></meta>'
      );

      const [encodedFilename, attachedFile] = entries.next().value!;
      expect(encodedFilename).to.equal('submission.xml.enc');
      const attached = await getBlobText(attachedFile);
      expect(attached.length).to.be.greaterThan(userEnteredValue.length);
      expect(attached).to.not.contain(userEnteredValue);
    });
  });
});
