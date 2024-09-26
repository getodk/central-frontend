<script setup lang="ts">
import PrimeChip from 'primevue/chip';
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
								<PrimeChip class="beta-chip" label="BETA" />
							</div>

							<h1 class="pape-title">
								ODK Web Forms Preview
							</h1>

							<p class="page-description">
								We're building a new web forms experience designed from the
								ground up to be fast and user-friendly. Try a preview below! You
								can learn more and let us know what you think on the
								<a
									class="inline-anchor"
									href="https://forum.getodk.org/t/web-forms-whats-next-and-our-plan-for-releasing/48146"
									target="_blank"
								>forum.</a>
							</p>

							<FormUpload />

							<p class="xls-tutorial-text">
								New to XLSForms?
								<a
									class="inline-anchor"
									href="https://docs.getodk.org/tutorial-first-form/"
									target="_blank"
								> Try this tutorial </a>
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
							form-title="WHO Verbal Autopsy"
							form-identifier="whova_form"
							image-name="who-va"
						>
							<template #description>
								Questions about the interviewer, HIV-Malaria mortality, and background information.
							</template>
						</DemoForm>
					</div>
				</div>
				<div class="row">
					<div class="col">
						<DemoForm
							form-title="PhilSA Disaster Incidence report"
							form-identifier="philsa-disaster-incidence-v20240917"
							image-name="philsa"
						>
							<template #description>
								Public form used for citizen science by The Philippines Space Agency.
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
								See all question types available in ODK! Track our
								<a
									class="inline-anchor"
									href="https://github.com/getodk/web-forms#feature-matrix"
									target="_blank"
								>feature progress</a>
								to learn about which are supported in Web Forms.
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
@import 'primeflex/core/_variables.scss';
.home-page-component {
	--font-family: 'Hanken Grotesk', Roboto, sans-serif;
	--primary-color: #009ecc;
	--primary-button-background-color: var(--primary-color);
	--primary-button-text-color: #ffffff;
	--primary-button-background-color-active: #079;
	--primary-button-background-color-hover: #0080a6;
	--secondary-button-background-color: rgba(0, 158, 204, 0.1);
	--secondary-button-text-color: var(--primary-color);
	--secondary-button-background-color-active: rgba(0, 158, 204, 0.2);
	--secondary-button-background-color-hover: rgba(0, 158, 204, 0.15);
	--alt-section-background: #f9fbfd;

	background-color: #ffffff;
	font-family: var(--font-family);

	display: flex;
	flex-direction: column;
	gap: 2rem;

	.container {
		width: 100%;
		max-width: 540px;
		margin: 0 auto;
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
				max-width: 500px;
			}
		}
	}

	section.demo-forms {
		background-color: var(--alt-section-background);
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
				background-color: var(--blue-50);
				font-size: 14px;
				padding: 5.25px 16px;

				:deep(.p-chip-text) {
					margin: 0;
				}
			}

			h1.pape-title {
				margin: 0;
				font-size: 2.25rem;
				font-weight: 400;
			}

			p.page-description {
				margin: 0;
				font-size: 1.1875rem;
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
		border-radius: 20px;

		.sample-image {
			width: 517px;
		}
		height: 517px;
	}

	h1.demo-form-heading {
		font-size: 2.25rem;
		font-weight: 400;
		margin: 0;
		padding: 0 1rem;
	}

	a.inline-anchor {
		color: var(--primary-color);
	}
}

@media screen and (min-width: #{$md}) {
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

@media screen and (min-width: #{$lg}) {
	.home-page-component {
		.container {
			max-width: 960px;
		}
	}
}

@media screen and (min-width: #{$xl}) {
	.home-page-component {
		.container {
			max-width: 1030px;
		}
	}
}
</style>
