<script setup lang="ts">
import type { AnyUnsupportedControlNode } from '@getodk/xforms-engine';

defineProps<{ question: AnyUnsupportedControlNode }>();
</script>

<template>
	<div>
		Unsupported field {<strong>{{ question.nodeType }}</strong>} in the form definition.
	</div>
</template>

