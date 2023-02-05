<script lang="ts">
	import { slide } from 'svelte/transition';
	import { getOS } from '../tools';
	import {
		Calculation,
		History,
		isCalculatorLoaded,
		calculate,
	} from '../calculation';

	let pendingCalculationOnceLoaded: string;
	let isLoading = !isCalculatorLoaded(() => {
		isLoading = false;
		if (pendingCalculationOnceLoaded) {
			submitCalculation(pendingCalculationOnceLoaded);
			pendingCalculationOnceLoaded = undefined;
		}
	});

	let currentInput = '';
	let currentResult = null;
	$: {
		currentResult = null;
		if (currentInput !== '') {
			try {
				const result = calculate(currentInput, 20);
				if (result.severity !== 'error' && result.output.length < 200) {
					currentResult = result.output;
				}
			} catch (e) {
				currentResult = 'Error';
			}
		}
	}
	let calculations: Calculation[] = History.load();

	function clearHistory() {
		calculations = History.reset();
	}

	function submitCalculation(input: string) {
		if (isLoading) {
			pendingCalculationOnceLoaded = input;
			return;
		}
		calculations = [calculate(input), ...calculations];
		if (calculations.length > 30) {
			calculations = calculations.slice(0, 30);
		}
		window.localStorage?.setItem(
			'qalculator-history',
			JSON.stringify(calculations),
		);
	}

	function submitCalculationFromInput() {
		if (
			currentInput === '' || // nothing to calculate
			(calculations.length > 0 &&
				currentInput === calculations[0].rawInput && // same calculation as before
				!calculations[0].id.startsWith('tut')) // only allow that for tutorials
		)
			return;
		submitCalculation(currentInput);
		currentInput = '';
	}

	function keypress(ev: KeyboardEvent) {
		if (ev.key === 'Enter') {
			submitCalculationFromInput();
		}
	}
	let inputElement: HTMLInputElement;
	function selectCalculation(calc: string) {
		currentInput = calc;
		inputElement.focus();
	}

	let windowBluring = false;
	function windowBlur() {
		windowBluring = true;
		setTimeout(() => (windowBluring = false), 250);
	}
	function inputBlur() {
		setTimeout(() => {
			if (!windowBluring) {
				submitCalculationFromInput();
			}
		}, 100);
	}

	const isDesktopOS = ['win', 'linux', 'mac'].includes(getOS());
</script>

<svelte:window on:blur={windowBlur} />
<div class="content">
	<h1>Qalculator</h1>
	<input
		type="text"
		placeholder="Your calculation"
		autocomplete="off"
		class="query"
		autofocus
		bind:value={currentInput}
		bind:this={inputElement}
		on:keypress={keypress}
		on:blur={inputBlur}
	/>
	{#if currentResult}
		<div class="directResult" transition:slide>
			= {@html currentResult}
		</div>
	{/if}
	<div class="responses">
		{#if isLoading && pendingCalculationOnceLoaded}
			<div transition:slide>
				<div class="loading"><span /></div>
			</div>
		{/if}
		{#each calculations as calculation (calculation.id)}
			<div
				on:click={() => selectCalculation(calculation.rawInput)}
				transition:slide
			>
				<div class="input">
					{@html calculation.input}
				</div>
				<div class="output">
					{@html calculation.output}
				</div>
				{#if calculation.messages.length > 0}
					<div
						class="message"
						class:error={calculation.severity === 'error'}
						class:warning={calculation.severity === 'warning'}
						class:info={calculation.severity === 'info'}
					>
						{#each calculation.messages as message}
							<div>{message}</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
		{#if isDesktopOS}
			<div class="calloutQalculate">
				<a href="https://qalculate.github.io/">
					<img src="/qalculate.svg" width="64" height="64" alt="" />
				</a>
				<div>
					Looking for a fully fledged calculator for PC/Mac?<br />
					<small>
						Give
						<a href="https://qalculate.github.io/">Qalculate!</a>
						a try!
					</small>
				</div>
			</div>
		{/if}
		{#if History.isEmpty(calculations)}
			<button class="clearHistoryButton" on:click={clearHistory}>
				Clear history
			</button>
		{/if}
	</div>
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

	.query {
		width: 100%;
		border: none;
		border-radius: 25px;
		height: 50px;
		padding: 0 20px;
		background: #344;
		color: #eff;
		text-align: center;
		margin-bottom: 10px;
	}
	.query::placeholder {
		color: #dee;
		opacity: 0.5;
		text-align: center;
	}

	.responses {
		flex: 1;
		overflow: auto;
		margin: 10px auto 0;
		width: 100%;
		max-width: 750px;
	}

	.responses > div {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 5px 10px;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
	}

	.responses > div + div {
		margin-top: 10px;
	}

	.message {
		margin: 10px 0 5px;
		font-size: 0.8em;
		opacity: 0.8;
		-webkit-hyphens: auto;
		hyphens: auto;
	}

	.error {
		color: lightsalmon;
	}

	.warning {
		color: orange;
	}

	.info {
		opacity: 0.8;
	}

	.input {
		opacity: 0.85;
		padding-left: 25px;
	}

	.input::before {
		content: '>';
		opacity: 0.4;
		display: inline-block;
		margin-left: -25px;
		margin-right: 25px;
		width: 0;
	}

	.output {
		margin: 20px 40px;
		font-size: 1.1em;
	}

	.disclaimer {
		font-size: 0.9rem;
		font-size: max(min(0.9rem, 2.5vh), 0.6rem);
		opacity: 0.5;
		line-height: 1.25;
		margin: 7px 10px;
		margin: 7px 10px calc(max(7px, env(safe-area-inset-bottom)));
	}

	.loading {
		display: block;
		margin: 10px auto;
		height: 40px;
		width: 40px;
	}

	.loading::before,
	.loading::after,
	.loading > span {
		content: '';
		display: block;
		position: absolute;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background-color: #899;
		opacity: 0.5;
		animation: bounce 2s infinite ease-in-out;
	}

	.loading > span {
		animation-delay: -1.33s;
	}

	.loading::after {
		animation-delay: -0.66s;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: scale(0);
		}
		50% {
			transform: scale(1);
		}
	}

	.calloutQalculate.calloutQalculate {
		display: flex;
		align-items: center;
		line-height: 1.3;
		font-size: 1.1rem;
		cursor: default;
	}

	.calloutQalculate img {
		display: block;
		margin: 0 15px 0 -5px;
	}

	.calloutQalculate small {
		font-size: 1rem;
		opacity: 0.85;
	}

	.clearHistoryButton {
		display: block;
		background: none;
		font: inherit;
		color: inherit;
		border: none;
		font-size: 0.9rem;
		opacity: 0.5;
		text-decoration: underline;
		cursor: pointer;
		margin: 5px auto;
	}
</style>
