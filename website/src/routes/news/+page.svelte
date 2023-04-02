<script lang="ts">
	import { faCopy } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onNewsRead } from './version';

	onNewsRead();
</script>

<h2>News</h2>

<h3>2023-04-02 Additional settings</h3>
<ul>
	<li>
		For angles, one can now choose between radians, degrees and gradians
	</li>
	<li>
		Additional settings using the <a
			href="https://qalculate.github.io/manual/qalc.html#SETTINGS"
			target="_blank"
			rel="noreferrer"
		>
			qalc syntax
		</a> are now supported. Additionally, custom variables can be defined.
	</li>
</ul>
<p>To try them out, switch to the <a href="/settings">settings</a> page.</p>

<h3>2023-03-11 Copy result</h3>
<p>
	Calculation results can now be copied using the <FontAwesomeIcon
		icon={faCopy}
	/> button/swipe.
</p>

<h3>2023-02-11 Constant suggestions, swipe gestures &amp; bookmarks</h3>
<p>
	When entering constants, suggestions are now shown in place. Try to enter
	"pi*3" or "planck"!<br />
	Tip: You can also use the arrow/enter keys to select a suggestion.
</p>
<p>
	Calculations in the history can now be bookmarked! Once bookmarked, they
	won't get lost anymore.<br />
	Tip: You can give bookmarked calculations a name.
</p>
<p>
	On devices with touch support, you can now swipe left/right on a calculation
	in the history to remove, bookmark or copy it.
</p>

<style>
	p,
	ul,
	h3 {
		text-align: left;
		max-width: 60ch;
		margin-left: auto;
		margin-right: auto;
	}

	p,
	ul {
		font-size: 1.1rem;
		line-height: 1.5;
	}

	ul {
		padding-left: 20px;
	}
</style>
