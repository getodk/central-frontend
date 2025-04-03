import { getBlobData, getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import {
	bind,
	body,
	group,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
	upload,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { InstanceData } from '@getodk/xforms-engine';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { assert, beforeEach, describe, expect, it } from 'vitest';
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
	});
});
