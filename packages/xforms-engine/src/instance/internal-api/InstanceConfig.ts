import type { InstanceAttachmentFileNameFactory } from '../../client/attachments/InstanceAttachmentsConfig.ts';
import type {
  FormInstanceConfig,
  GeolocationProvider,
  PrefillParameters,
  PreloadProperties,
} from '../../client/form/FormInstanceConfig.ts';
import type { OpaqueReactiveObjectFactory } from '../../client/OpaqueReactiveObjectFactory.ts';

export interface InstanceConfig {
  /**
   * @see {@link FormInstanceConfig.stateFactory}
   */
  readonly clientStateFactory: OpaqueReactiveObjectFactory;

  readonly computeAttachmentName: InstanceAttachmentFileNameFactory;

  readonly preloadProperties: PreloadProperties;

  readonly prefillParameters: PrefillParameters;

  readonly geolocationProvider: GeolocationProvider | undefined;
}
