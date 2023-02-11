export class Settings {
	useUnitPrefixes = true;

	useDecimalPoint = false;

	load() {
		if (typeof window === 'undefined') return;
		const savedSettings = window.localStorage?.getItem(
			'qalculator-settings',
		);
		if (!savedSettings) return;
		const settings = JSON.parse(savedSettings);
		this.useUnitPrefixes = settings.useUnitPrefixes ?? true;
		this.useDecimalPoint = settings.useDecimalPoint ?? false;
	}

	save() {
		if (typeof window === 'undefined') return;
		window.localStorage?.setItem(
			'qalculator-settings',
			JSON.stringify({
				useUnitPrefixes: this.useUnitPrefixes,
				useDecimalPoint: this.useDecimalPoint,
			}),
		);
	}

	constructor() {
		this.load();
	}
}
