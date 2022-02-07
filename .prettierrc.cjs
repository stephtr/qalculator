module.exports = {
	printWidth: 80,
	tabWidth: 4,
	useTabs: true,
	trailingComma: 'all',
	singleQuote: true,
	plugins: [require('prettier-plugin-svelte')],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
};