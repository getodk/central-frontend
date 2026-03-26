// disable linting to allow overwriting private functions from the library
/* eslint-disable */
// @ts-nocheck

import ImageBlobReduce from 'image-blob-reduce';

const IMAGE_QUALITY = 0.8;

export const resize = async (file: File, max: number): Promise<File> => {
	const reducer = ImageBlobReduce();

	// This looks ugly but is actually the documented approach to setting image quality
	// https://github.com/nodeca/image-blob-reduce/#customization
	reducer._create_blob = function (env) {
		return this.pica.toBlob(env.out_canvas, env.blob.type, IMAGE_QUALITY).then((blob) => {
			env.out_blob = blob;
			return env;
		});
	};
	const blob = await reducer.toBlob(file, { max });
	return new File([blob], file.name, { type: file.type });
};
