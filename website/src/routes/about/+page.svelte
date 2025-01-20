<script lang="ts">
	import HomeLink from '$lib/homeLink.svelte';

	const email = 'stephanDELETEtroyer+qalculator|live.at'
		.replace('|', '@')
		.replace('DELETE', '');
</script>

<h2>About Qalculator.xyz</h2>
<p>by Stephan Troyer</p>
<img src="/logo.png" alt="" width="150" />

<p>
	This project is made possible thanks to the power of the <a
		href="https://github.com/Qalculate/libqalculate">libqalculate</a
	> library by Hanna Knutsson.
</p>

<p>
	<a href="https://qalculate.github.io/manual/qalculate-definitions-functions.html" target="_blank">Functions</a> • 
	<a href="https://qalculate.github.io/manual/qalculate-definitions-variables.html" target="_blank">Variables</a> • 
	<a href="https://qalculate.github.io/manual/qalculate-definitions-units.html" target="_blank">Units</a> • 
	<a href="/examples">Examples</a>
</p>

<h3>Feedback</h3>
<p>
	...is welcome 🙂<br />
	Via
	{#if typeof window !== 'undefined'}
		<a href={`mailto:${email}`}>Email</a> or directly via
	{/if}
	<a href="https://github.com/stephtr/qalculator">GitHub</a>
</p>

<h3>Imprint</h3>
<p>
	Stephan Troyer<br />
	{#if typeof window !== 'undefined'}
		{email}<br />
	{/if}
	Prägraten, Austria
</p>
<HomeLink />

<style>
	img {
		max-width: 100%;
		margin: 20px auto 10px;
	}
	p {
		max-width: 30em;
		margin-left: auto;
		margin-right: auto;
	}
</style>
