/* eslint-disable import/no-extraneous-dependencies */
import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter({
			precompress: true,
		}),
	},
};

export default config;
