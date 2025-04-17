<script setup lang="ts">
import Chip from 'primevue/chip';
import DemoForm from './DemoForm.vue';
import FormList from './DevFormList.vue';
import FormUpload from './FormUpload.vue';

const isDev = import.meta.env.DEV;
</script>

<template>
	<div class="home-page-component">
		<section>
			<div class="container">
				<div class="row">
					<div class="col intro-wrapper">
						<div class="intro-block">
							<div>
								<Chip class="beta-chip" label="PREVIEW" />
							</div>

							<h1 class="pape-title">
								ODK Web Forms Preview
							</h1>

							<p class="page-description">
								We're building a new web forms experience designed from the
								ground up to be fast and user-friendly. Try the preview below! You
								can learn more and let us know what you think on the
								<a
									class="inline-anchor"
									href="https://forum.getodk.org/t/web-forms-preview-xlsforms-in-odk-web-forms/49817"
									target="_blank"
								>forum</a>.
							</p>

							<FormUpload />

							<p class="xls-tutorial-text">
								New to XLSForms?
								<a
									class="inline-anchor"
									href="https://docs.getodk.org/tutorial-first-form/"
									target="_blank"
								> Try this tutorial</a>.
							</p>
						</div>
					</div>
					<div class="col">
						<div class="sample-preview">
							<img
								class="sample-image"
								srcset="../assets/images/demo-screenshot@1x.jpg,
												../assets/images/demo-screenshot@2x.jpg 2x"
								src="../assets/images/demo-screenshot@2x.jpg"
								alt="Sample Form Preview"
							>
						</div>
					</div>
				</div>
			</div>
		</section>
		<section class="demo-forms">
			<div class="container">
				<h1 class="demo-form-heading">
					Try real forms
				</h1>
				<div class="row">
					<div class="col">
						<DemoForm
							form-title="WHO Verbal Autopsy"
							form-identifier="whova_form"
							image-name="who-va"
						>
							<template #description>
								500-question form to identify likely cause of death. Uses selects, required, and relevance.
								<a
									class="inline-anchor"
									href="https://www.who.int/standards/classifications/other-classifications/verbal-autopsy-standards-ascertaining-and-attributing-causes-of-death-tool"
									target="_blank"
								>Source</a>.
							</template>
						</DemoForm>
					</div>
					<div class="col">
						<DemoForm
							form-title="IFRC Distribution Site Assessment"
							form-identifier="ifrc-distribution-site-assessment-v1"
							image-name="ifrc-dsa"
						>
							<template #description>
								Assessing places where Red Cross and Red Crescent provide cash aid. Uses multiple languages, images, and groups.
								<a
									class="inline-anchor"
									href="https://cash-hub.org/resource/odk-distribution-site-assessment-xls-form"
									target="_blank"
								>Source</a>.
							</template>
						</DemoForm>
					</div>
				</div>
				<div class="row">
					<div class="col">
						<DemoForm
							form-title="Socio-economic survey"
							form-identifier="socio-economic-survey-v20240515"
							image-name="socio-economic"
						>
							<template #description>
								Questions to understand the social and economic conditions of individuals within a population.
							</template>
						</DemoForm>
					</div>
					<div class="col">
						<DemoForm
							form-title="All question types"
							form-identifier="all-question-types-v2024091201"
							image-name="all-questions"
						>
							<template #description>
								All question types available in ODK! Track our
								<a
									class="inline-anchor"
									href="https://github.com/getodk/web-forms#feature-matrix"
									target="_blank"
								>feature progress</a>
								to learn about which questions are supported in Web Forms.
							</template>
						</DemoForm>
					</div>
				</div>
			</div>
		</section>

		<section v-if="isDev" class="dev-forms">
			<FormList />
		</section>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.home-page-component {
	/* Using 'Hanken Grotesk' font in the Preview page to match ODK site. Forms and fields use Roboto only. */
	font-family: 'Hanken Grotesk', Roboto, sans-serif;

	background-color: var(--odk-base-background-color);
	display: flex;
	flex-direction: column;
	gap: 2rem;

	.container {
		width: 100%;
		max-width: min(100%, 540px);
		margin: 30px auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;

		.row {
			display: flex;
			flex-wrap: wrap;
			gap: 2rem;
			justify-content: space-between;
			padding: 0 1rem;

			.col {
				flex: 0 0 100%;
				padding: 0;
				max-width: min(100%, 500px);
			}
		}
	}

	section.demo-forms {
		background-color: var(--odk-muted-background-color);
		padding: 2rem 0;
	}

	.intro-wrapper {
		display: flex;
		align-items: center;

		.intro-block {
			display: flex;
			flex-direction: column;
			gap: 18px;

			.beta-chip {
				background-color: var(--odk-primary-lighter-background-color);
				font-size: var(--odk-base-font-size);
				padding: 5.25px 16px;

				:deep(.p-chip-text) {
					margin: 0;
				}
			}

			h1.pape-title {
				margin: 0;
				font-size: var(--odk-heading-font-size);
				font-weight: 400;
			}

			p.page-description {
				margin: 0;
				font-size: var(--odk-question-font-size);
				font-weight: 300;
			}

			p.xls-tutorial-text {
				margin: 0;
				font-weight: 300;
			}
		}
	}

	.sample-preview {
		overflow: hidden;
		border-radius: var(--odk-radius);

		.sample-image {
			width: 517px;
		}
		height: 517px;
	}

	h1.demo-form-heading {
		font-size: var(--odk-heading-font-size);
		font-weight: 400;
		margin: 0;
		padding: 0 1rem;
	}

	a.inline-anchor {
		color: var(--odk-primary-text-color);
	}
}

@media screen and (min-width: #{pf.$md}) {
	.home-page-component {
		.container {
			max-width: 720px;

			.row {
				padding: 0;

				.col {
					flex: 0 0 calc(50% - 1rem);
					width: calc(50% - 1rem);
				}
			}
		}

		.intro-wrapper {
			.intro-block {
				margin-right: 20px;
			}
		}

		h1.demo-form-heading {
			padding: 0;
		}
	}
}

@media screen and (min-width: #{pf.$lg}) {
	.home-page-component {
		.container {
			max-width: 960px;
		}
	}
}

@media screen and (min-width: #{pf.$xl}) {
	.home-page-component {
		.container {
			max-width: 1030px;
		}
	}
}
</style>
