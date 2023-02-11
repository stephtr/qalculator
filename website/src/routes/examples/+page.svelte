<script lang="ts">
	import { getContext } from 'svelte';
	import { calculatorKey, type CalculatorContext } from '$lib/calculatorHost';
	import { examples } from '$lib/examples';
	import HomeLink from '$lib/homeLink.svelte';

	const { selectCalculation } = getContext<CalculatorContext>(calculatorKey);

	function load(calculation: string) {
		const calc = $selectCalculation;
		calc(calculation);
	}
</script>

<h2>Examples</h2>

{#each examples as exampleCategory (exampleCategory.category)}
	<h3>{exampleCategory.category}</h3>
	{#each exampleCategory.examples as example (example.rawInput)}
		<button class="example" on:click={() => load(example.rawInput)}>
			{@html example.input}
		</button>
	{/each}
{/each}
<h3>More...</h3>
<div class="example">
	The examples are based on
	<a href="https://qalculate.github.io/index.html">Qalculate</a>. For a full
	list of supported functions, have a look at
	<a href="https://qalculate.github.io/manual/">Qalculate's manual</a>!
</div>

<HomeLink />

<style>
	.example {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 15px 20px;
		text-align: left;
		overflow: hidden;
		position: relative;
		display: block;
		width: 100%;
		border: none;
		color: inherit;
	}

	button.example {
		cursor: pointer;
	}

	.example + .example {
		margin-top: 10px;
	}
</style>
