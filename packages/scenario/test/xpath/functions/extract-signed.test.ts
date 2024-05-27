import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

/**
 * **PORTING NOTES**
 *
 * All of the namespaces below are intended to produce the bare minimum API
 * equivalents as called into by supporting methods defined in the JavaRosa test
 * "vat". It's unlikely we'll want any of these in a longer term, more portable
 * test structure. This felt like the shortest path for porting the tests with
 * fidelity enough that they can be updated when we're ready to work on
 * `extract-signed` feature support.
 */

/* eslint-disable @typescript-eslint/no-namespace */
namespace java {
	export namespace security {
		export class SecureRandom {}
	}
}

namespace org.bouncycastle.crypto {
	export interface CipherParameters {
		readonly TODO_CipherParameters: true;
	}

	export class AsymmetricCipherKeyPair {
		getPublic(): org.bouncycastle.crypto.params.AsymmetricKeyParameter {
			throw new Error('TODO');
		}

		getPrivate(): org.bouncycastle.crypto.params.AsymmetricKeyParameter {
			throw new Error('TODO');
		}
	}

	export class KeyGenerationParameters {}

	export namespace generators {
		export class Ed25519KeyPairGenerator {
			init(_keyGenerationParameters: KeyGenerationParameters): void {
				throw new Error('TODO');
			}

			generateKeyPair(): AsymmetricCipherKeyPair {
				throw new Error('TODO');
			}
		}
	}

	export namespace params {
		export class AsymmetricKeyParameter implements CipherParameters {
			readonly TODO_CipherParameters = true;

			getEncoded(): Uint8Array {
				throw new Error('TODO');
			}
		}

		export class Ed25519KeyGenerationParameters extends KeyGenerationParameters {
			constructor(_secureRandom: java.security.SecureRandom) {
				super();
				throw new Error('TODO');
			}
		}

		export class Ed25519PublicKeyParameters extends AsymmetricKeyParameter {}
	}

	export namespace signers {
		export class Ed25519Signer {
			init(_b: boolean, _cipherParameters: CipherParameters): void {
				throw new Error('TODO');
			}

			update(_bytes: Uint8Array, _i: number, _i1: number): void {
				throw new Error('TODO');
			}

			generateSignature(): Uint8Array {
				throw new Error('TODO');
			}
		}
	}
}

namespace org.javarosa.xpath.expr {
	class Base64Encoder {
		encode(data: Uint8Array): string {
			const bytes = new Uint8Array(data);
			const chars = bytes.reduce<string[]>((acc, byte) => {
				acc.push(String.fromCharCode(byte));

				return acc;
			}, []);

			return btoa(chars.join(''));
		}
	}

	export class Encoding {
		static readonly BASE64 = new Base64Encoder();

		constructor(
			readonly type: 'base64',
			readonly encoded: string
		) {}

		getEncoded(): Uint8Array {
			const encoder = new TextEncoder();

			return encoder.encode(this.encoded);
		}
	}
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * **PORTING NOTES**
 *
 * While `extract-signed` isn't yet documented in the
 * {@link https://getodk.github.io/xforms-spec/ | ODK XForms spec}, a quick
 * check on Slack confirmed that the intent is that it should be. We'll also
 * likely want to test this in the `xpath` package. For now, the expectation is
 * that these ported tests will fail pending feature support, and these tests
 * can serve as a preliminary quasi-spec to guide that implementation.
 *
 * **WARNINGS/CONSIDERATION FOR FUTURE SPEC AND IMPLEMENTATION**
 *
 * It is _highly likely_ that implementation of any encryption features in web
 * forms will involve tradeoffs between API consistency and bundle size. This is
 * already the case in the implementation (in `xpath` package) of the XPath
 * `digest` function. This discussion addresses the functionality under test in
 * this suite, as well as existing `digest` functionality. To clarify, this is
 * the tradeoff:
 *
 * - To the extent there may be native functionality to satisfy the
 *   spec/expected behavior, it will tend to be asynchronous. This is inherently
 *   incompatible (well, almost, see below) with the interface guarantees for
 *   XPath evaluation, with many assumptions baked into the current engine
 *   internal implementation, and with our baseline expectations for
 *   engine/client write interfaces.
 *
 * - While not our largest bundle size concern, encryption-related dependencies
 *   are definitely a significant contributor to our already bloated bundle.
 *
 * We're almost certainly going to want to lean toward preserving synchrony,
 * where we have it, as much as we possibly can. Introducing asynchrony to
 * fundamental aspects of form computations is something we shouldn't take
 * lightly. It has the potential to break many assumptions (internally) and
 * expectations (in terms of user experience).
 *
 * Potential mitigations:
 *
 * 1. We could consider making encryption-related (or really, many) dependencies
 *    optional. IIRC, there's precedent for this in Enketo, albeit
 *    config-driven. But it needn't be config driven. If we pursue this, we can
 *    make it largely transparent to users (apart from bytes on the wire)—with
 *    appropriate consideration in the build (i.e.. code splitting) and the
 *    mechanism for optionality (i.e. upfront form analysis on load, dynamic
 *    import of split code during form initialization which is already async).
 *
 * 2. To the extent there are native APIs that satisfy our use cases, it seems
 *    pretty likely that we can work around their asynchrony _under some
 *    circumstances_. Those circumstances would likely be the same set of
 *    conditions which gate whether we can provide offline functionality:
 *    namely, any restrictions placed on service workers, which we could
 *    hypothetically use to "de-async" certain computations. Rather than get
 *    deep into what that would involve, a starting point would be to reference
 *    {@link https://partytown.builder.io/how-does-partytown-work | Partytown}
 *    (as a semi-general purpose implementation of the concept).
 */
describe('`extract-signed`', () => {
	describe('ExtractSignedTest.java', () => {
		const { SecureRandom } = java.security;

		type AsymmetricCipherKeyPair = org.bouncycastle.crypto.AsymmetricCipherKeyPair;
		type AsymmetricKeyParameter = org.bouncycastle.crypto.params.AsymmetricKeyParameter;
		type Ed25519PublicKeyParameters = org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;

		const { Ed25519KeyPairGenerator } = org.bouncycastle.crypto.generators;
		const { Ed25519KeyGenerationParameters } = org.bouncycastle.crypto.params;
		const { Ed25519Signer } = org.bouncycastle.crypto.signers;

		const { Encoding } = org.javarosa.xpath.expr;

		/**
		 * **PORTING NOTES**
		 *
		 * It would presumably behave the same way, but would it make
		 * (likely/typical) usage more clear if the public key were assigned to a
		 * model node, and that node referenced in the `extract-signed` call? Do we
		 * expect usage to involve multiple key pairs?
		 */
		const createScenario = async (
			encodedContents: string,
			encodedPublicKey: string
		): Promise<Scenario> => {
			return Scenario.init(
				'extract signed form',
				html(
					head(
						title('extract signed form'),
						model(
							mainInstance(
								t('data id="extract-signed"', t('contents', encodedContents), t('extracted'))
							),
							bind('/data/contents').type('string'),
							bind('/data/extracted')
								.type('string')
								.calculate("extract-signed(/data/contents,'" + encodedPublicKey + "')")
						)
					),
					body(input('/data/contents'))
				)
			);
		};

		const createKeyPair = (): AsymmetricCipherKeyPair => {
			const ed25519KeyPairGenerator = new Ed25519KeyPairGenerator();

			ed25519KeyPairGenerator.init(new Ed25519KeyGenerationParameters(new SecureRandom()));

			return ed25519KeyPairGenerator.generateKeyPair();
		};

		/**
		 * As equivalent to usage of Java `String#getBytes`
		 */
		const stringGetBytes = (value: string): Uint8Array => {
			const encoder = new TextEncoder();

			return encoder.encode(value);
		};

		const signMessage = (message: string, privateKey: AsymmetricKeyParameter): Uint8Array => {
			const signer = new Ed25519Signer();

			signer.init(true, privateKey);

			const messageBytes = stringGetBytes(message);

			signer.update(messageBytes, 0, messageBytes.length);

			const signature = signer.generateSignature();

			const signedMessage = new Uint8Array(signature.length + messageBytes.length);

			signedMessage.set(signature, 0);
			signedMessage.set(messageBytes, signature.length);

			return signedMessage;
		};

		describe('when [the] signature is valid', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 * - Fails pending feature support, implementation of setup.
			 * - Unclear whether cast to `Ed25519PublicKeyParameters` is meaningful.
			 *   It's preserved here, but commented out in subsequent tests.
			 */
			it.fails('[decodes signed content] returns non-signature contents', async () => {
				const message = 'real genuine data';
				const keyPair = createKeyPair();

				const signedMessage = signMessage(message, keyPair.getPrivate());
				const encodedPublicKey = Encoding.BASE64.encode(
					(keyPair.getPublic() as Ed25519PublicKeyParameters).getEncoded()
				);
				const encodedContents = Encoding.BASE64.encode(signedMessage);

				const scenario = await createScenario(encodedContents, encodedPublicKey);

				expect(scenario.answerOf('/data/extracted')).toEqualAnswer(stringAnswer(message));
			});
		});

		describe('when [the] signature is not valid', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Typical `nullValue()` -> blank/empty string check.
			 */
			it.fails('returns [an] empty string', async () => {
				const message = 'real genuine data';
				const keyPair1 = createKeyPair();
				const keyPair2 = createKeyPair();

				const signedMessage = signMessage(message, keyPair1.getPrivate());
				const encodedPublicKey = Encoding.BASE64.encode(
					keyPair2
						.getPublic() /*  as Ed25519PublicKeyParameters */
						.getEncoded()
				);
				const encodedContents = Encoding.BASE64.encode(signedMessage);

				const scenario = await createScenario(encodedContents, encodedPublicKey);

				// assertThat(scenario.answerOf("/data/extracted"), is(nullValue()));
				expect(scenario.answerOf('/data/extracted').getValue()).toBe('');
			});
		});

		describe('when [called with] no arg[ument]s', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * As with most error condition tests, rephrase (re: anticipation of
			 * Result type) and less specific error assertion.
			 */
			it('[produces an error] throws exception', async () => {
				const init = async () => {
					return Scenario.init(
						'extract signed form',
						html(
							head(
								title('extract signed form'),
								model(
									mainInstance(
										t('data id="extract-signed"', t('contents', 'blah'), t('extracted'))
									),
									bind('/data/extracted').type('string').calculate('extract-signed()')
								)
							),
							body(input('/data/contents'))
						)
					);
				};

				await expect(init).rejects.toThrowError();
			});
		});

		describe('when content is too short', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Typical `nullValue()` -> blank/empty string check.
			 *
			 * - For spec/implementation: this seems like it probably should be an
			 *   error condition. The data isn't "too short", it's unsigned. It's
			 *   possible there's **also** a minimum length scenario to test? But that
			 *   seems unlikely given the next test exercises a (signed) empty string.
			 */
			it.fails('returns [an] empty string', async () => {
				const keyPair = createKeyPair();
				const encodedPublicKey = Encoding.BASE64.encode(
					keyPair
						.getPublic() /* as Ed25519PublicKeyParameters */
						.getEncoded()
				);

				const scenario = await createScenario('blah', encodedPublicKey);

				// assertThat(scenario.answerOf("/data/extracted"), is(nullValue()));
				expect(scenario.answerOf('/data/extracted').getValue()).toBe('');
			});
		});

		describe('when non-signature data is empty', () => {
			describe('and signature is valid', () => {
				it.fails('returns [an] empty string', async () => {
					const message = '';
					const keyPair = createKeyPair();

					const signedMessage = signMessage(message, keyPair.getPrivate());
					const encodedPublicKey = Encoding.BASE64.encode(
						keyPair
							.getPublic() /* as Ed25519PublicKeyParameters */
							.getEncoded()
					);
					const encodedContents = Encoding.BASE64.encode(signedMessage);

					const scenario = await createScenario(encodedContents, encodedPublicKey);

					// assertThat(scenario.answerOf("/data/extracted"), is(nullValue()));
					expect(scenario.answerOf('/data/extracted').getValue()).toBe('');
				});
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * This almost certainly should be an error condition?
		 */
		describe('when public key is too short', () => {
			it.fails('returns [an] empty string', async () => {
				const message = '';
				const keyPair = createKeyPair();

				const signedMessage = signMessage(message, keyPair.getPrivate());
				const encodedPublicKey = Encoding.BASE64.encode(stringGetBytes('blah'));
				const encodedContents = Encoding.BASE64.encode(signedMessage);

				const scenario = await createScenario(encodedContents, encodedPublicKey);

				// assertThat(scenario.answerOf("/data/extracted"), is(nullValue()));
				expect(scenario.answerOf('/data/extracted').getValue()).toBe('');
			});
		});

		/**
		 * Subset of ~java.util.UUID
		 */
		class UUID {
			static randomUUID(): UUID {
				return new this();
			}

			private readonly uuid: string;

			constructor() {
				this.uuid = crypto.randomUUID();
			}

			toString(): string {
				return this.uuid;
			}
		}

		/**
		 * **PORTING NOTES**
		 *
		 * - Is this test meaningfully different from the "too short" case above?
		 * - If not redundant, it should almost certainly be an error condition.
		 */
		describe('when public key is invalid', () => {
			it.fails('returns [an] empty string', async () => {
				const message = '';
				const keyPair = createKeyPair();

				const signedMessage = signMessage(message, keyPair.getPrivate());
				const encodedPublicKey = Encoding.BASE64.encode(
					stringGetBytes(UUID.randomUUID().toString())
				);
				const encodedContents = Encoding.BASE64.encode(signedMessage);

				const scenario = await createScenario(encodedContents, encodedPublicKey);

				// assertThat(scenario.answerOf("/data/extracted"), is(nullValue()));
				expect(scenario.answerOf('/data/extracted').getValue()).toBe('');
			});
		});

		describe('when [signed message?] non-signature part includes unicode', () => {
			it.fails('successfully decodes', async () => {
				const message = '🎃';
				const keyPair = createKeyPair();

				const signedMessage = signMessage(message, keyPair.getPrivate());
				const encodedPublicKey = Encoding.BASE64.encode(
					keyPair
						.getPublic() /* as Ed25519PublicKeyParameters */
						.getEncoded()
				);
				const encodedContents = Encoding.BASE64.encode(signedMessage);

				const scenario = await createScenario(encodedContents, encodedPublicKey);

				// assertThat(scenario.answerOf("/data/extracted"), is(nullValue()));
				expect(scenario.answerOf('/data/extracted').getValue()).toBe('');
			});
		});
	});
});
