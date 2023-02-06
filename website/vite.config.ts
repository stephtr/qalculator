import { sveltekit } from '@sveltejs/kit/vite';

const config: import('vite').UserConfig = {
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['../.yarn/unplugged'],
		},
	},
};

export default config;
