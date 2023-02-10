<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import { readable } from 'svelte/store';
	import HistoryWidget from '$lib/historyWidget.svelte';
	import { calculatorKey, type CalculatorContext } from '$lib/calculatorHost';

	const {
		calculator,
		selectCalculation,
		aboutToSelectCalculation,
		submitOnBlur,
		autofocus,
	} = getContext<CalculatorContext>(calculatorKey);

	// this mechanism is necessary for coupling Svelte to the events of `Calculator`
	$: loadedStore = readable<boolean>(undefined, (set) => {
		const onLoadedChange = () => set(calculator.isLoaded);
		onLoadedChange();
		calculator.addOnLoadedListener(onLoadedChange);
		return () => calculator.removeOnLoadedListener(onLoadedChange);
	});
	/** Whether qalculator has fully loaded */
	$: isLoaded = $loadedStore;

	$: calculationStore = readable<boolean>(false, (set) => {
		const onCalculation = () => set(true);
		calculator.addOnCalculationListener(onCalculation);
		return () => calculator.removeOnCalculationListener(onCalculation);
	});
	/** Whether the user already made a calculation */
	$: madeACalculation = $calculationStore;

	submitOnBlur.set(true);
	autofocus.set(true);
	onDestroy(() => {
		submitOnBlur.set(false);
		autofocus.set(false);
	});
</script>

<HistoryWidget
	history={calculator.history}
	showLoadingIndicator={!isLoaded && madeACalculation}
	onselectcalculation={$selectCalculation}
	onabouttoselect={$aboutToSelectCalculation}
/>
