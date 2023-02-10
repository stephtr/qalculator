<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { Calculator } from '$lib/calculator';
	import { calculatorKey, type CalculatorContext } from '$lib/calculatorHost';
	import CalculatorWidget from '$lib/calculatorWidget.svelte';

	const calculator = new Calculator();

	const selectCalculation = writable(() => {});
	const aboutToSelectCalculation = writable(() => {});
	const submitOnBlur = writable(false);
	const updateCurrentResult = writable(() => {});
	const autofocus = writable(false);

	setContext<CalculatorContext>(calculatorKey, {
		calculator,
		selectCalculation,
		aboutToSelectCalculation,
		submitOnBlur,
		updateCurrentResult,
		autofocus,
	});
</script>

<div class="content">
	<a href="/" class="mainLink"><h1>Qalculator</h1></a>
	<CalculatorWidget
		{calculator}
		bind:selectCalculation={$selectCalculation}
		bind:aboutToSelectCalculation={$aboutToSelectCalculation}
		submitOnBlur={$submitOnBlur}
		bind:updateCurrentResult={$updateCurrentResult}
	/>
	<div class="slot">
		<slot />
	</div>
	<footer>
		<a href="/about">About &amp; Imprint</a>
		<a href="/settings">Settings</a>
	</footer>
</div>

{@html '<scr' + 'ipt src="/calc.js" async></script>'}

<style>
	@import '../zero.css';
	@import '../reset.css';

	.content {
		width: 90vw;
		width: calc(
			100vw - 2 *
				max(env(safe-area-inset-right), env(safe-area-inset-left), 5vw)
		);
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
		font-size: 20px;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 5vw;
		right: 5vw;
		display: flex;
		flex-direction: column;
	}

	.mainLink {
		cursor: default;
		text-decoration: none;
	}

	h1 {
		padding: 20px 0;
		padding: max(min(20px, 2vh), env(safe-area-inset-top)) 0 min(20px, 2vh);
		font-size: 3.5rem;
		font-size: max(min(3.5rem, 10vh), 1.5rem);
	}

	.slot {
		flex: 1;
		overflow: auto;
		margin: 15px auto 0;
		width: 100%;
		max-width: 750px;
	}

	footer {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1em;
		font-size: 1rem;
		opacity: 0.5;
		line-height: 1.25;
		margin: 7px 10px 10px;
		margin: 7px 10px calc(max(10px, env(safe-area-inset-bottom)));
	}
</style>
