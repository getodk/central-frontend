export const XFORM_EVENT = {
	odkInstanceLoad: 'odk-instance-load',
	odkInstanceFirstLoad: 'odk-instance-first-load',
	odkNewRepeat: 'odk-new-repeat',
	xformsRevalidate: 'xforms-revalidate',
	xformsValueChanged: 'xforms-value-changed',
} as const;

export type XFormEvent = (typeof XFORM_EVENT)[keyof typeof XFORM_EVENT];
