<script lang="ts" setup>
import { RouterLink } from 'vue-router';

const formFixtureGlobImports = import.meta.glob<true, 'raw', string>('../../../ui-solid/fixtures/xforms/**/*.xml', {
	query: '?raw'
});

type CategoryType = Record<string, string[]>;

const categories = Object.keys(formFixtureGlobImports)
	.map(f => f.replace('../../../ui-solid/fixtures/xforms/', ''))
	.reduce((result: CategoryType, f:string) => {
		// TODO! These would normally be inferred as `string | undefined`, but the
		// current TypeScript configuration is overly lax. See
		// https://github.com/getodk/web-forms/issues/212
		const [categoryName, formName] = f.split('/');

		result[categoryName] ??= [];
		result[categoryName].push(formName)

		return result;
	}, {});
</script>

<template>
	<div class="component-root">
		<h1>Demo Forms</h1>
		<ul class="category-list">
			<li
				v-for="(category,categoryName) in categories"
				:key="categoryName"
			>
				<details>
					<summary>{{ categoryName }}</summary>

					<ul class="form-list">
						<li v-for="formName in category" :key="formName">
							<RouterLink :to="`/form/${categoryName}/${formName}`">
								{{ formName }}
							</RouterLink>
						</li>
					</ul>
				</details>
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

		summary {
			padding: 0.5rem;

			&:hover {
				background-color: var(--gray-100);
			}
		}

		ul.form-list {
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
	}
}

</style>
