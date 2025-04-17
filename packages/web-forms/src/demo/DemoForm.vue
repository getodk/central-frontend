<script lang="ts" setup>
import { xformFixturesByIdentifier } from '@getodk/common/fixtures/xforms';
import { xlsFormUrlMap } from '@getodk/common/fixtures/xlsforms';
import Button from 'primevue/button';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps<{
	formTitle: string;
	formIdentifier: string;
	imageName: string;
}>();

const imageSrcSet = computed(
	() => `
	${new URL(`../assets/images/${props.imageName}@1x.jpg`, import.meta.url).href},
	${new URL(`../assets/images/${props.imageName}@2x.jpg`, import.meta.url).href} 2x
`
);

const imageSrc = computed(
	() => new URL(`../assets/images/${props.imageName}@2x.jpg`, import.meta.url).href
);

const formXml = computed(() => {
	return xformFixturesByIdentifier.get(`${props.formIdentifier}.xml`)?.resourceURL.href;
});

const formXls = computed(() => {
	return xlsFormUrlMap.get(`${props.formIdentifier}`);
});
</script>

<template>
	<div class="demo-form">
		<div class="form-image-wrap">
			<img class="form-image" :srcset="imageSrcSet" :src="imageSrc" alt="demo form image">
		</div>
		<div class="details">
			<h2>
				{{ formTitle }}
			</h2>
			<p class="description">
				<slot name="description" />
			</p>
			<div class="actions">
				<RouterLink :to="`/form?url=${formXml}`" target="_blank" class="form-preview-link">
					<Button class="preview-button" label="View Form" icon="icon-remove_red_eye" />
				</RouterLink>
				<a :href="formXls">
					<Button class="download-button" label="Download" severity="contrast" variant="outlined" icon="icon-file_download" />
				</a>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.demo-form {
	border-radius: var(--odk-radius);
	overflow: hidden;
	border: 1px solid var(--odk-border-color);
	background: var(--odk-base-background-color);

	.form-image-wrap {
		overflow: hidden;
		position: relative;
		display: flex;
		justify-content: center;

		.form-image {
			width: 500px;
			height: 172px;
			display: block;
			opacity: 0.9;
		}
	}

	h2 {
		margin: 0.5rem 0;
		font-size: var(--odk-group-font-size);
		font-weight: 400;
	}

	.details {
		padding: 1rem;
	}

	.description {
		min-height: 4rem;
		font-weight: 300;
	}

	.actions {
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}

	:deep(.p-button) .p-button-icon {
		font-size: var(--odk-icon-size);
	}
}
</style>
