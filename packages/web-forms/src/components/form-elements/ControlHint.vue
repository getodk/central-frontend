<script setup lang="ts">
import MarkdownBlock from '@getodk/web-forms/components/common/MarkdownBlock.vue';
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
import { computed, inject } from 'vue';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

const t: Translate = inject(TRANSLATE)!;

const props = defineProps<{ question: QuestionNode }>();

const label = computed(() => props.question.currentState.hint?.formatted);
const guidanceHint = computed(() => props.question.currentState.hint?.guidanceHint);
</script>

<template>
	<div v-if="question.currentState.hint" class="hint">
		<div v-if="question.currentState.hint">
			<MarkdownBlock v-for="elem in label" :key="elem.id" :elem="elem" />
		</div>
		<div v-if="guidanceHint?.length">
			<Accordion class="w-full max-w-md">
				<AccordionPanel value="0">
					<AccordionHeader :pt="{ root: { tabindex: '-1' } }">
						<span class="chevron-closed"><IconSVG name="mdiChevronDown" variant="muted" /></span>
						<span class="chevron-open"><IconSVG name="mdiChevronUp" variant="muted" /></span>
						{{ t('control_hint.details.label') }}
						<template #toggleicon>
							<span class="hidden" />
						</template>
					</AccordionHeader>
					<AccordionContent>
						<MarkdownBlock v-for="elem in guidanceHint" :key="elem.id" :elem="elem" />
					</AccordionContent>
				</AccordionPanel>
			</Accordion>
		</div>
	</div>
</template>

<style scoped lang="scss">
.hint {
	font-size: var(--odk-hint-font-size);
	font-weight: 300;
	color: var(--odk-muted-text-color);
	margin: 4px 0 var(--odk-spacing-m) 0;
	line-height: calc(var(--odk-hint-font-size) * 1.45);
	word-wrap: break-word;
	white-space: pre-wrap;
}
.p-accordionpanel {
	margin-top: var(--odk-spacing-s);
}
.p-accordionheader {
	justify-content: left;
	padding: 0;
	font-weight: normal;
}
.p-accordionpanel {
	border: 0;
}
:deep(.p-accordioncontent-content) {
	padding: 0;
}
.chevron-open {
	display: none;
}
.p-accordionpanel-active {
	.chevron-open {
		display: inline;
	}
	.chevron-closed {
		display: none;
	}
}
</style>
