import { getBlobData, getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import {
	bind,
	body,
	group,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	t,
	title,
	upload,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type {
	AnyNode,
	FormNodeID,
	InstanceAttachmentsConfig,
	InstanceData,
	InstancePayload,
	LeafNodeValidationState,
	RootNode,
	UploadNode,
} from '@getodk/xforms-engine';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestFormOptions } from '../../src/client/init.ts';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('Instance attachments: binary output', () => {
	const FAKE_INSTANCE_ID = 'not important to this suite';

	it('includes attachments in instance payload data', async () => {
		const scenario = await Scenario.init(
			'Basic upload control',
			// prettier-ignore
			html(
				head(
					title('Basic upload control'),
					model(
						mainInstance(
							t('data id="basic-upload-control"',
								t('file-upload'),
								t('meta',
									t('instanceID', FAKE_INSTANCE_ID)))),
						bind('/data/file-upload').type('binary'))),
				body(
					upload('/data/file-upload')))
		);

		const uploadName = 'upload.txt';
		const uploadData = 'uploaded file data';
		const uploadValue = new File([uploadData], uploadName, {
			type: 'text/plain',
		});

		scenario.answer('/data/file-upload', uploadValue);

		const { data } = await scenario.prepareWebFormsInstancePayload();
		const attachments = new Map(
			Array.from(data[0]).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
		);

		expect(attachments.size).toBe(1);

		const attachment = attachments.get(uploadName);

		assert(attachment != null);
		expect(attachment.name).toBe(uploadName);

		const actualData = await getBlobText(attachment);

		expect(actualData).toBe(uploadData);
	});

	describe('chunked instance payload', () => {
		const sizedFile = (name: string, bytes: number): File => {
			const data = new Uint8Array(bytes).fill(0).map(() => {
				return Math.floor(Math.random() * 255);
			});

			const file = new File([data], name, {
				type: 'application/octet-stream',
			});

			expect(file.size).toBe(bytes);

			return file;
		};

		const sumChunkSize = (chunk: InstanceData): number => {
			return Array.from(chunk.values()).reduce((size, file) => {
				return size + file.size;
			}, 0);
		};

		const assertChunkedUploads = async (
			uploads: readonly File[],
			chunks: readonly InstanceData[],
			maxChunkSize: number
		) => {
			for (const chunk of chunks) {
				const chunkSize = sumChunkSize(chunk);

				expect(chunkSize).toBeLessThanOrEqual(maxChunkSize);
			}

			await Promise.all(
				uploads.map(async (uploadFile) => {
					let namedMatch: File | null = null;

					for (const chunk of chunks) {
						namedMatch = chunk.get(uploadFile.name);

						if (namedMatch != null) {
							break;
						}
					}

					assert(namedMatch != null);

					const [uploadData, matchedData] = await Promise.all([
						getBlobData(uploadFile),
						getBlobData(namedMatch),
					]);

					expect(uploadData).toEqual(matchedData);
				})
			);
		};

		let scenario: Scenario;

		beforeEach(async () => {
			scenario = await Scenario.init(
				'Chunked uploads',
				// prettier-ignore
				html(
					head(
						title('Chunked uploads'),
						model(
							mainInstance(
								t('data id="chunked-uploads"',
									t('files',
										t('upload-0'),
										t('upload-1'),
										t('upload-2'),
										t('upload-3')),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/files/upload-0').type('binary'),
							bind('/data/files/upload-1').type('binary'),
							bind('/data/files/upload-2').type('binary'),
							bind('/data/files/upload-3').type('binary'))),
					body(
						group('/data/files',
							upload('/data/files/upload-0'),
							upload('/data/files/upload-1'),
							upload('/data/files/upload-2'),
							upload('/data/files/upload-3'))))
			);
		});

		it('chunks instance attachments by a specified max size', async () => {
			const baseMaxChunkSize = 400;

			const uploads = [
				sizedFile('upload-0', 100),
				sizedFile('upload-1', 200),
				sizedFile('upload-2', 300),
				sizedFile('upload-3', 400),
			] as const;

			scenario.answer('/data/files/upload-0', uploads[0]);
			scenario.answer('/data/files/upload-1', uploads[1]);
			scenario.answer('/data/files/upload-2', uploads[2]);
			scenario.answer('/data/files/upload-3', uploads[3]);

			const instanceXML = scenario.proposed_serializeInstance();
			const instanceXMLBytes = instanceXML.length;
			const maxChunkSize = baseMaxChunkSize + instanceXMLBytes;

			const payload = await scenario.prepareWebFormsInstancePayload({
				payloadType: 'chunked',
				maxSize: maxChunkSize,
			});
			const chunks = payload.data;

			expect(chunks.length).toBe(3);

			await assertChunkedUploads(uploads, chunks, maxChunkSize);
		});

		it('includes the instance file in each chunk', async () => {
			const baseMaxChunkSize = 400;

			const uploads = [
				sizedFile('upload-0', 100),
				sizedFile('upload-1', 200),
				sizedFile('upload-2', 300),
				sizedFile('upload-3', 400),
			] as const;

			scenario.answer('/data/files/upload-0', uploads[0]);
			scenario.answer('/data/files/upload-1', uploads[1]);
			scenario.answer('/data/files/upload-2', uploads[2]);
			scenario.answer('/data/files/upload-3', uploads[3]);

			const instanceXML = scenario.proposed_serializeInstance();
			const instanceXMLBytes = instanceXML.length;
			const maxChunkSize = baseMaxChunkSize + instanceXMLBytes;

			const payload = await scenario.prepareWebFormsInstancePayload({
				payloadType: 'chunked',
				maxSize: maxChunkSize,
			});
			const chunks = payload.data;

			expect(chunks.length).toBe(3);

			for (const chunk of chunks) {
				const instanceFile = chunk.get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);

				assert(instanceFile != null);

				const instanceFileText = await getBlobText(instanceFile);

				expect(instanceFileText).toEqual(instanceXML);
			}
		});

		it('produces instance XML if no instance attachments have been uploaded', async () => {
			const baseMaxChunkSize = Math.floor(Math.random() * 400);

			const instanceXML = scenario.proposed_serializeInstance();
			const instanceXMLBytes = instanceXML.length;
			const maxChunkSize = baseMaxChunkSize + instanceXMLBytes;

			const payload = await scenario.prepareWebFormsInstancePayload({
				payloadType: 'chunked',
				maxSize: maxChunkSize,
			});
			const chunks = payload.data;

			expect(chunks.length).toBe(1);

			const [chunk] = chunks;
			const instanceFile = chunk.get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);

			assert(instanceFile != null);

			const instanceFileText = await getBlobText(instanceFile);

			expect(instanceFileText).toEqual(instanceXML);
		});

		/**
		 * @todo
		 *
		 * **Engine API notes**
		 *
		 * This test exercises failure to satisfy a `maxSize` because the combined
		 * total of bytes for the instance XML and attachment (forming a minimal
		 * {@link InstanceData} including the attachment) exceeds that `maxSize`.
		 *
		 * As exercised by the test, this error is **NOT** produced when the
		 * excessively large attachment is assigned to an `<upload>` control!
		 * Instead, it's produced when attempting to serialize the
		 * {@link InstancePayload}. This is an inherent limitation of the current
		 * engine/client interface, where `maxSize` is not specified until
		 * serialization.
		 *
		 * It would probably be more user friendly to produce an error at the time
		 * the excessively large attachment _is assigned_. Such user-friendlier
		 * behavior is currently blocked by the following:
		 *
		 * 1. Order of operations: an equivalent to the `maxSize` option would need
		 *    to be specified at instance creation time.
		 * 2. Broad/conceptual: {@link UploadNode.setValue} would need to provide
		 *    some feedback to clients when the `maxSize` condition cannot be
		 *    satisfied.
		 *
		 * Given other error production priorities, the latter also strongly
		 * suggests at one (or perhaps both!) of the following:
		 *
		 * 1. Expression of fallibility in write APIs:
		 *     - {@link UploadNode.setValue} should no longer return
		 *       {@link RootNode}. Instead, it should return whatever variant of
		 *       `Result` type we end up adopting for error production generally.
		 *     - {@link AnyNode | All nodes'} write methods should follow suit.
		 *     - We should have a clear understanding of what sorts of error
		 *       conditions may occur from **each respective write method**, for
		 *       those return type revisions to be meaningful.
		 *
		 * 2. Expression of exceeding max size as a validation concern:
		 *     - {@link UploadNode.validationState} should report this as a
		 *       {@link LeafNodeValidationState.violation | violation}...
		 *     - ... which may co-occur with a
		 *       {@link LeafNodeValidationState.constraint | constraint}
		 *       violation...
		 *     - ... which implies an {@link UploadNode} may actually have more than
		 *       one effective "violation" at a time (and so it can't be reported as
		 *       a singular, nullable value)
		 */
		it('produces an error when a single instance attachment exceeds the specified max size', async () => {
			const baseMaxChunkSize = 400;

			const uploads = [sizedFile('upload-0', baseMaxChunkSize + 1)] as const;

			scenario.answer('/data/files/upload-0', uploads[0]);

			const instanceXML = scenario.proposed_serializeInstance();
			const instanceXMLBytes = instanceXML.length;
			const maxChunkSize = baseMaxChunkSize + instanceXMLBytes;

			const preparePayload = async () => {
				await scenario.prepareWebFormsInstancePayload({
					payloadType: 'chunked',
					maxSize: maxChunkSize,
				});
			};

			await expect(preparePayload).rejects.toThrowError(AggregateError);
		});
	});

	describe('support for distinct file names', () => {
		const INDISTINGUISHABLE_BASE_NAME = 'indistinguishable';
		const INDISTINGUISHABLE_FILE_NAME = `${INDISTINGUISHABLE_BASE_NAME}.txt`;

		class IndistinguishablyNamedFile extends File {
			override readonly name = INDISTINGUISHABLE_FILE_NAME;
			override readonly type = 'text/plain';

			constructor(data: string) {
				super([data], INDISTINGUISHABLE_FILE_NAME, { type: 'text/plain' });
			}
		}

		type QuadTuple<T> = readonly [T, T, T, T];

		interface UploadMeta {
			readonly node: UploadNode;
			readonly file: IndistinguishablyNamedFile;
			readonly uploadedAt: Date;
		}

		interface DistinctFileNamesScenarioResult {
			readonly scenario: Scenario;
			readonly uploads: QuadTuple<UploadMeta>;
		}

		const initDistinctFileNamesScenario = async (
			instanceAttachments: InstanceAttachmentsConfig
		): Promise<DistinctFileNamesScenarioResult> => {
			class DistinctFileNamesScenario extends Scenario {
				static override getTestFormOptions(): TestFormOptions {
					return super.getTestFormOptions({ instanceAttachments });
				}
			}

			const scenario = await DistinctFileNamesScenario.init(
				'Distinct file names',
				// prettier-ignore
				html(
					head(
						title('Distinct file names'),
						model(
							mainInstance(
								t('data id="distinct-file-names"',
									t('files',
										t('upload-0'),
										t('upload-1'),
										t('upload-2'),
										t('upload-3')),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/files/upload-0').type('binary'),
							bind('/data/files/upload-1').type('binary'),
							bind('/data/files/upload-2').type('binary'),
							bind('/data/files/upload-3').type('binary'))),
					body(
						group('/data/files',
							upload('/data/files/upload-0'),
							upload('/data/files/upload-1'),
							upload('/data/files/upload-2'),
							upload('/data/files/upload-3'))))
			);

			const getUploadNode = (reference: string): UploadNode => {
				const node = scenario.getInstanceNode(reference);

				assert(node.nodeType === 'upload');

				return node;
			};

			const now = Date.now();

			vi.useFakeTimers({ now });

			const uploads = [
				{
					node: getUploadNode('/data/files/upload-0'),
					file: new IndistinguishablyNamedFile('0'),
					uploadedAt: new Date(now + 100),
				},
				{
					node: getUploadNode('/data/files/upload-1'),
					file: new IndistinguishablyNamedFile('1'),
					uploadedAt: new Date(now + 1000),
				},
				{
					node: getUploadNode('/data/files/upload-2'),
					file: new IndistinguishablyNamedFile('2'),
					uploadedAt: new Date(now + 10000),
				},
				{
					node: getUploadNode('/data/files/upload-3'),
					file: new IndistinguishablyNamedFile('3'),
					uploadedAt: new Date(now + 100000),
				},
			] as const;

			const uploadIndex = (index: 0 | 1 | 2 | 3): void => {
				const { node, file, uploadedAt } = uploads[index];

				vi.setSystemTime(uploadedAt);
				node.setValue(file);
			};

			uploadIndex(0);
			uploadIndex(1);
			uploadIndex(2);
			uploadIndex(3);

			return {
				scenario,
				uploads,
			};
		};

		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('populates metadata about the node', async () => {
			const stripNodeIDPrefix = (nodeId: FormNodeID): string => {
				return nodeId.replace('node:', '');
			};

			const { scenario, uploads } = await initDistinctFileNamesScenario({
				fileNameFactory: ({ nodeId, basename, extension }) => {
					return `${basename}-${stripNodeIDPrefix(nodeId)}${extension ?? ''}`;
				},
			});

			const expectedFileName = (index: 0 | 1 | 2 | 3): string => {
				const { nodeId } = uploads[index].node;

				return `${INDISTINGUISHABLE_BASE_NAME}-${stripNodeIDPrefix(nodeId)}.txt`;
			};

			const expectedFileNames = [
				expectedFileName(0),
				expectedFileName(1),
				expectedFileName(2),
				expectedFileName(3),
			] as const;

			const { data } = await scenario.prepareWebFormsInstancePayload();

			assert(data.length === 1);

			const [payloadFiles] = data;
			const instanceFile = payloadFiles.get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);

			vi.useRealTimers();

			const instanceXML = await getBlobText(instanceFile);

			expect(instanceXML).toBe(
				// prettier-ignore
				t('data id="distinct-file-names"',
					t('files',
						t('upload-0', expectedFileNames[0]),
						t('upload-1', expectedFileNames[1]),
						t('upload-2', expectedFileNames[2]),
						t('upload-3', expectedFileNames[3])
					),
					t('meta',
						t('instanceID', FAKE_INSTANCE_ID))).asXml()
			);

			const attachments = new Map(
				Array.from(payloadFiles).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
			);

			for (const [index, expected] of expectedFileNames.entries()) {
				const attachment = attachments.get(expected);

				assert(attachment);

				const attachmentData = await getBlobText(attachment);

				expect(attachmentData).toBe(`${index}`);
			}
		});

		it('populates metadata about when the file was written', async () => {
			const timestampedFileName = (
				basename: string,
				extension: string | null,
				writtenAt: Date
			): string => {
				return `${basename}-${writtenAt.getTime()}${extension ?? ''}`;
			};

			const { scenario, uploads } = await initDistinctFileNamesScenario({
				fileNameFactory: ({ writtenAt, basename, extension }) => {
					return timestampedFileName(basename, extension, writtenAt);
				},
			});

			const expectedFileName = (index: 0 | 1 | 2 | 3): string => {
				const { uploadedAt } = uploads[index];

				return timestampedFileName(INDISTINGUISHABLE_BASE_NAME, '.txt', uploadedAt);
			};

			const expectedFileNames = [
				expectedFileName(0),
				expectedFileName(1),
				expectedFileName(2),
				expectedFileName(3),
			] as const;

			const { data } = await scenario.prepareWebFormsInstancePayload();

			assert(data.length === 1);

			const [payloadFiles] = data;
			const instanceFile = payloadFiles.get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);

			vi.useRealTimers();

			const instanceXML = await getBlobText(instanceFile);

			expect(instanceXML).toBe(
				// prettier-ignore
				t('data id="distinct-file-names"',
					t('files',
						t('upload-0', expectedFileNames[0]),
						t('upload-1', expectedFileNames[1]),
						t('upload-2', expectedFileNames[2]),
						t('upload-3', expectedFileNames[3])
					),
					t('meta',
						t('instanceID', FAKE_INSTANCE_ID))).asXml()
			);

			const attachments = new Map(
				Array.from(payloadFiles).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
			);

			for (const [index, expected] of expectedFileNames.entries()) {
				const attachment = attachments.get(expected);

				assert(attachment);

				const attachmentData = await getBlobText(attachment);

				expect(attachmentData).toBe(`${index}`);
			}
		});
	});

	describe('repeats', () => {
		let scenario: Scenario;

		beforeEach(async () => {
			scenario = await Scenario.init(
				'Repeat uploads',
				// prettier-ignore
				html(
					head(
						title('Repeat uploads'),
						model(
							mainInstance(
								t('data id="repeat-uploads"',
									t('files jr:template=""',
										t('upload')),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/files/upload').type('binary'))),
					body(
						repeat('/data/files',
							upload('/data/files/upload'))))
			);
		});

		it('adds uploads in added repeat instances', async () => {
			const uploads = [
				new File(['upload-0'], 'upload-0.txt', { type: 'text/plain' }),
				new File(['upload-1'], 'upload-1.txt', { type: 'text/plain' }),
				new File(['upload-2'], 'upload-2.txt', { type: 'text/plain' }),
				new File(['upload-3'], 'upload-3.txt', { type: 'text/plain' }),
			] as const;

			for (const [index, file] of uploads.entries()) {
				scenario.createNewRepeat('/data/files');

				const reference = `/data/files[${index + 1}]/upload`;

				scenario.answer(reference, file);
			}

			const { data } = await scenario.prepareWebFormsInstancePayload();

			assert(data.length === 1);

			const [payloadFiles] = data;
			const instanceFile = payloadFiles.get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);

			vi.useRealTimers();

			const instanceXML = await getBlobText(instanceFile);

			expect(instanceXML).toBe(
				// prettier-ignore
				t('data id="repeat-uploads"',
					t('files',
						t('upload', uploads[0].name)),
					t('files',
						t('upload', uploads[1].name)),
					t('files',
						t('upload', uploads[2].name)),
					t('files',
						t('upload', uploads[3].name)),
					t('meta',
						t('instanceID', FAKE_INSTANCE_ID))).asXml()
			);

			const attachments = new Map(
				Array.from(payloadFiles).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
			);

			for (const [index, expected] of uploads.entries()) {
				const attachment = attachments.get(expected.name);

				assert(attachment);

				const attachmentData = await getBlobText(attachment);

				expect(attachmentData).toBe(`upload-${index}`);
			}
		});

		it('removes uploads in removed repeat instances', async () => {
			const uploads = [
				new File(['upload-0'], 'upload-0.txt', { type: 'text/plain' }),
				new File(['upload-1'], 'upload-1.txt', { type: 'text/plain' }),
				new File(['upload-2'], 'upload-2.txt', { type: 'text/plain' }),
				new File(['upload-3'], 'upload-3.txt', { type: 'text/plain' }),
			] as const;

			for (const [index, file] of uploads.entries()) {
				scenario.createNewRepeat('/data/files');

				const reference = `/data/files[${index + 1}]/upload`;

				scenario.answer(reference, file);
			}

			scenario.removeRepeat('/data/files[1]');

			const { data } = await scenario.prepareWebFormsInstancePayload();

			assert(data.length === 1);

			const [payloadFiles] = data;
			const instanceFile = payloadFiles.get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);

			vi.useRealTimers();

			const instanceXML = await getBlobText(instanceFile);

			expect(instanceXML).toBe(
				// prettier-ignore
				t('data id="repeat-uploads"',
					t('files',
						t('upload', uploads[1].name)),
					t('files',
						t('upload', uploads[2].name)),
					t('files',
						t('upload', uploads[3].name)),
					t('meta',
						t('instanceID', FAKE_INSTANCE_ID))).asXml()
			);

			const attachments = new Map(
				Array.from(payloadFiles).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
			);

			for (const expected of uploads.slice(1)) {
				const attachment = attachments.get(expected.name);

				assert(attachment);

				const expectedData = await getBlobText(expected);
				const attachmentData = await getBlobText(attachment);

				expect(attachmentData).toBe(expectedData);
			}
		});
	});

	describe('relevance', () => {
		it('omits a non-relevant upload', async () => {
			const scenario = await Scenario.init(
				'Upload relevance',
				// prettier-ignore
				html(
					head(
						title('Upload-relevance'),
						model(
							mainInstance(
								t('data id="upload-relevance"',
									t('upload-relevant', '1'),
									t('upload-file'),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/upload-relevant'),
							bind('/data/upload-file')
								.type('binary')
								.relevant('/data/upload-relevant &gt; 0'))),
					body(
						input('/data/upload-relevant'),
						upload('/data/upload-file')))
			);

			const uploadFile = new File(['uploaded if relevant'], 'upload-if-relevant.txt', {
				type: 'text/plain',
			});

			scenario.answer('/data/upload-file', uploadFile);

			// Set upload-file non-relevant
			scenario.answer('/data/upload-relevant', 0);

			// Prerequisite
			const uploadNode = scenario.getInstanceNode('/data/upload-file');

			assert(uploadNode.nodeType === 'upload');

			expect(uploadNode).toBeNonRelevant();

			const { data } = await scenario.prepareWebFormsInstancePayload();

			assert(data.length === 1);

			const [payloadFiles] = data;
			const instanceFile = payloadFiles.get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);

			const instanceXML = await getBlobText(instanceFile);

			expect(instanceXML).toBe(
				// prettier-ignore
				t('data id="upload-relevance"',
					t('upload-relevant', '0'),
					t('meta',
						t('instanceID', FAKE_INSTANCE_ID))).asXml()
			);

			const attachments = new Map(
				Array.from(payloadFiles).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
			);

			expect(attachments.size).toBe(0);
		});
	});
});
