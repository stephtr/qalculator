<script lang="ts">
	import { readable } from 'svelte/store';
	import { Calculator } from '$lib/calculator';
	import HistoryWidget from '$lib/historyWidget.svelte';
	import CalculatorWidget from '$lib/calculatorWidget.svelte';

	const calculator = new Calculator();

	$: loadedStore = readable<boolean>(undefined, (set) => {
		const onLoadedChange = () => set(calculator.isLoaded);
		onLoadedChange();
		calculator.addOnLoadedListener(onLoadedChange);
		return () => calculator.removeOnLoadedListener(onLoadedChange);
	});
	$: isLoaded = $loadedStore;

	$: calculationStore = readable<boolean>(false, (set) => {
		const onCalculation = () => set(true);
		calculator.addOnCalculationListener(onCalculation);
		return () => calculator.removeOnCalculationListener(onCalculation);
	});
	$: madeACalculation = $calculationStore;

	let selectCalculation: (calculation: string) => void;
</script>

<div class="content">
	<h1>Qalculator</h1>
	<CalculatorWidget {calculator} bind:selectCalculation />
	<HistoryWidget
		history={calculator.history}
		showLoadingIndicator={!isLoaded && madeACalculation}
		onselectcalculation={selectCalculation}
	/>
	<div class="disclaimer">
		by Stephan Troyer, powered by
		<a href="https://github.com/Qalculate/libqalculate">libqalculate</a>
	</div>
</div>

{@html '<scr' + 'ipt src="/calc.js" async></script>'}

<style>
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

	h1 {
		padding: 20px 0;
		padding: max(min(20px, 2vh), env(safe-area-inset-top)) 0 min(20px, 2vh);
		font-size: 3.5rem;
		font-size: max(min(3.5rem, 10vh), 1.5rem);
	}

	.disclaimer {
		font-size: 0.9rem;
		font-size: max(min(0.9rem, 2.5vh), 0.6rem);
		opacity: 0.5;
		line-height: 1.25;
		margin: 7px 10px;
		margin: 7px 10px calc(max(7px, env(safe-area-inset-bottom)));
	}
</style>
