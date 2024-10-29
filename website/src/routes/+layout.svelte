<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { slide } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faArrowRotateRight,
		faStar,
	} from '@fortawesome/free-solid-svg-icons';
	import { Calculator } from '$lib/calculator';
	import { calculatorKey, type CalculatorContext } from '$lib/calculatorHost';
	import CalculatorWidget from '$lib/calculatorWidget.svelte';
	import LoadingIndicator from '$lib/loadingIndicator.svelte';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import { addNewsReadLister, newsAvailable } from './news/version';
	import { setupTracking } from './tracking';

	config.autoAddCss = false;

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

	let newServiceWorker: ServiceWorker | null = null;
	let isRestarting = false;

	function updateQalculate() {
		isRestarting = true;
		newServiceWorker?.postMessage({
			type: 'update',
		});
	}

	let newsUpdateAvailable = false;

	if (typeof window !== 'undefined') {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		navigator.serviceWorker?.ready?.then((reg) => {
			newServiceWorker = reg.waiting;
			reg.addEventListener('updatefound', () => {
				const newWorker = reg.installing;
				newWorker?.addEventListener('statechange', () => {
					if (newWorker.state === 'installed') {
						newServiceWorker = newWorker;
					}
				});
			});
		});

		navigator.serviceWorker?.addEventListener(
			'message',
			(event: MessageEvent<{ type: string; data?: any }>) => {
				switch (event.data?.type) {
					case 'reload':
						window.location.reload();
						break;
					case 'updateCurrencyData':
						if (!event.data) return;
						calculator.updateCurrencyData(event.data?.data);
						break;
					default:
						throw new Error(`Unknown message ${event.data?.type}`);
				}
			},
		);

		fetch('/api/getCurrencyData').then(async (response) => {
			const json = await response.json();
			calculator.updateCurrencyData(json);
		});
	}
	let isTouchScreen = false;
	function touchstart() {
		isTouchScreen = true;
	}

	newsUpdateAvailable = newsAvailable();
	addNewsReadLister(() => {
		newsUpdateAvailable = false;
	});

	setupTracking(calculator.settings.sendUsageStatistics);
</script>

<svelte:window on:touchstart={touchstart} />

<div class="content" class:isTouchScreen>
	<a href="/" class="mainLink"><h1>Qalculator.xyz</h1></a>
	<CalculatorWidget
		{calculator}
		bind:selectCalculation={$selectCalculation}
		bind:aboutToSelectCalculation={$aboutToSelectCalculation}
		submitOnBlur={$submitOnBlur}
		bind:updateCurrentResult={$updateCurrentResult}
	/>
	<div class="slot">
		{#if isRestarting}
			<div class="updateNotification">
				<p class="update">
					Updating..
					<LoadingIndicator />
				</p>
			</div>
		{:else if newServiceWorker}
			<button
				on:click={updateQalculate}
				class="updateNotification"
				transition:slide
			>
				<p class="update">
					<FontAwesomeIcon icon={faArrowRotateRight} />
					An update is available, click to restart Qalculator.xyz.
				</p>
			</button>
		{/if}
		<slot />
	</div>
	<footer>
		<a href="/news">
			News
			{#if newsUpdateAvailable}
				<span class="highlight">
					<FontAwesomeIcon icon={faStar} />
				</span>
			{/if}
		</a>
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
		font-size: 3.2rem;
		font-size: max(min(3.2rem, min(8vh, 10vw)), 1.5rem);
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
		color: #768181;
		line-height: 1.25;
		margin: 7px 10px 10px;
		margin: 7px 10px calc(max(10px, env(safe-area-inset-bottom)));
	}

	.updateNotification {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 5px 10px;
		cursor: pointer;
		overflow: hidden;
		position: relative;
		display: block;
		width: 100%;
		border: none;
		color: inherit;
		margin-bottom: 10px;
		color: rgba(150, 180, 180);
		font-size: 0.9em;
		text-align: center;
	}

	.highlight {
		font-size: 0.8em;
		display: inline-block;
		transform: translateY(-5px);
		color: orange;
		opacity: 0.75;
	}
</style>
