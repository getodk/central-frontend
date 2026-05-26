import type { JavaNIOPath } from '../../java/nio/Path.ts';
import { TextFileResourcePath } from '../file/TextFileResourcePath.ts';

export class FormDefinitionResource extends TextFileResourcePath implements JavaNIOPath {
	readonly formName = this.getFileName().toString();
}
