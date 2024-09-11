<script lang="ts" setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const formFixtureGlobImports = import.meta.glob<true, 'raw', string>('../../../ui-solid/fixtures/xforms/**/*.xml', {
	query: '?raw'
});

type CategoryType = Record<string, string[]>;

const categories = Object.keys(formFixtureGlobImports)
	.map(f => f.replace('../../../ui-solid/fixtures/xforms/', '').replace('.xml', ''))
	.reduce((result: CategoryType, f:string) => {
		const parts = f.split('/');
		const category = parts.length == 2 ? parts[0] : 'Other';
		if(!result[category]){
			result[category] = [];
		}
		result[category].push(parts.length == 2 ? parts[1]: parts[0])
		return result;
	}, {});

const expandedCategories = ref(new Set());

const toggleCategory = (category:string) => {
	if(expandedCategories.value.has(category)) {
		expandedCategories.value.delete(category);
	}
	else {
		expandedCategories.value.add(category);
	}
}

</script>

<template>
	<div class="component-root">
		<h1>Demo Forms</h1>
		<ul class="category-list">
			<li
				v-for="(category,categoryName) in categories"
				:key="categoryName"
				:class="{ 'expanded': expandedCategories.has(categoryName) }"
				@click="toggleCategory(categoryName)"
			>
				{{ categoryName }}
				<ul class="form-list">
					<li v-for="form in category" :key="form">
						<RouterLink :to="`/form/${categoryName}/${form}`">
							{{ form }}
						</RouterLink>
					</li>
				</ul>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.component-root {
	background: white;
	height: 100vh;
	margin-top: -25px;
}

h1 {
	margin-left: 10px;
	padding-top: 20px;
}

.category-list {
	padding: 0;

	> li {
		list-style: none;
		cursor: pointer;
		margin: 10px;
		font-size: 20px;
		padding: 10px;

		&:hover {
			background-color: var(--gray-100);
		}

		&::before {
			content: '▶︎';
			margin-right: 10px;
		}

		ul.form-list {
			display: none;
			padding: 0 0 0 20px;

			li {
				list-style: none;
				margin: 10px;
				border: 1px solid var(--primary-500);
				border-radius: 10px;
				cursor: pointer;
				background-color: var(--surface-0);
				font-size: 16px;

				a {
					display: block;
					padding: 10px;
					text-decoration: none;
					color: var(--gray-900);

					&:visited {
						color: var(--gray-900)
					}
				}
			}

			li:hover {
				background-color: var(--primary-50);
			}
		}

		&.expanded {
			&::before {
				content: '▼';
			}
		 	ul.form-list {
				display: block;
			}
		}
	}
}

</style>
