<script setup lang="ts">
import IconSVG from '@/components/widgets/IconSVG.vue';
import {
	type FormLanguage,
	type RootNode,
	type SyntheticDefaultLanguage,
} from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Menu from 'primevue/menu';
import { ref } from 'vue';
import FormLanguageDialog from './FormLanguageDialog.vue';
import FormLanguageMenu from './FormLanguageMenu.vue';

const props = defineProps<{ form: RootNode }>();
const languageDialogState = ref(false);
const menu = ref<InstanceType<typeof Menu>>();

const isFormLanguage = (lang: FormLanguage | SyntheticDefaultLanguage): lang is FormLanguage => {
	return !lang.isSyntheticDefault;
};

const languages = props.form.languages.filter(isFormLanguage);

const print = () => window.print();

const items = ref([
	{
		// TODO: translations
		label: 'Print',
		icon: 'mdiPrinter',
		command: print,
	},
]);

if (languages.length > 0) {
	items.value.unshift({
		// TODO: translations
		label: 'Change language',
		icon: 'mdiWeb',
		command: () => (languageDialogState.value = true),
	});
}

const handleLanguageChange = (event: FormLanguage) => {
	props.form.setLanguage(event);
};
</script>

<template>
	<!-- for desktop -->
	<div class="hidden lg:inline larger-screens">
		<div class="flex justify-content-end flex-wrap gap-3">
			<Button class="print-button" severity="secondary" rounded @click="print">
				<IconSVG name="mdiPrinter" />
			</Button>
			<FormLanguageMenu
				:active-language="form.currentState.activeLanguage"
				:languages="languages"
				@update:active-language="handleLanguageChange"
			/>
		</div>
		<Card class="form-title">
			<template #content>
				<!-- TODO/q: should the title be on the definition or definition.form be accessible instead of definition.bind.form -->
				<h1>{{ form.definition.bind.form.title }}</h1>
			<!-- last saved timestamp -->
			</template>
		</Card>
	</div>


	<!-- for mobile and tablet -->
	<div class="flex lg:hidden align-items-start justify-content-between smaller-screens">
		<h1>
			{{ form.definition.bind.form.title }}
		</h1>

		<div class="form-options">
			<!-- if Form is not multilingual then we always show print button -->
			<Button v-if="languages.length === 0" class="print-button" severity="secondary" rounded @click="print">
				<IconSVG name="mdiPrinter" />
			</Button>

			<!-- show either hamburger or (print button and language changer) based on container size -->
			<div v-else class="multilingual">
				<Button class="btn-menu" text rounded aria-label="Menu" @click="menu?.toggle">
					<IconSVG name="mdiMenu" />
				</Button>
				<Menu id="overlay_menu" ref="menu" :model="items" :popup="true">
					<template #item="{ item }">
						<a v-if="item.command != null" class="p-menu-item-link" @click="(event) => item.command && item.command({ originalEvent: event, item })">
							<IconSVG v-if="item.icon != null" :name="item.icon" />
							<span>{{ item.label }}</span>
						</a>
					</template>
				</Menu>
				<FormLanguageDialog
					v-model:state="languageDialogState"
					:active-language="form.currentState.activeLanguage"
					:languages="languages"
					@update:active-language="handleLanguageChange"
				/>

				<Button class="print-button" severity="secondary" rounded @click="print">
					<IconSVG name="mdiPrinter" />
				</Button>
				<FormLanguageMenu
					:active-language="form.currentState.activeLanguage"
					:languages="languages"
					@update:active-language="handleLanguageChange"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.p-button.p-button-rounded {
	&:hover {
		background: var(--odk-primary-light-background-color);
		border-color: var(--odk-primary-border-color);
		outline: none;
	}

	&:active,
	&:focus {
		background: var(--odk-primary-lighter-background-color);
		border-color: var(--odk-primary-border-color);
		outline: none;
	}
}

.form-title {
	border-radius: var(--odk-radius);
	box-shadow: none;
	border-top: none;
	margin-top: 20px;

	:deep(.p-card-body) {
		padding-left: 3rem;
		padding-right: 3rem;

		h1 {
			font-size: var(--odk-title-font-size);
			font-weight: 500;
			margin: 10px 0;
		}
	}
}

.smaller-screens {
	background-color: var(--odk-base-background-color);
	border-bottom: 1px solid var(--odk-border-color);

	h1 {
		padding-left: 1.5rem;
		font-size: var(--odk-title-font-size);
		font-weight: 400;
	}

	.form-options {
		padding-right: 10px;
		min-width: 50px;
		container-type: size;
		container-name: formOptionsContainer;
		height: 40px;
		margin-top: 11px;

		.multilingual {
			display: flex;
			justify-content: end;
			gap: 0.5rem;

			.btn-menu :deep(.odk-icon) path {
				transform: scale(1.1) translate(-3px, -3px);
			}

			.print-button {
				display: none;
			}

			.language-changer {
				display: none;
			}
		}

		@container formOptionsContainer (min-width: 260px) {
			.multilingual {
				.btn-menu {
					display: none;
				}

				.print-button {
					display: flex;
				}

				.language-changer {
					display: flex;
					max-width: 220px;
				}
			}
		}
	}
}
</style>
