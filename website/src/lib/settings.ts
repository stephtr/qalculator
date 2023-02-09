export class Settings {
	useUnitPrefixes = true;

	load() {
		if (typeof window === 'undefined') return;
		const savedSettings = window.localStorage?.getItem(
			'qalculator-settings',
		);
		if (!savedSettings) return;
		const settings = JSON.parse(savedSettings);
		this.useUnitPrefixes = settings.useUnitPrefixes ?? true;
	}

	save() {
		if (typeof window === 'undefined') return;
		window.localStorage?.setItem(
			'qalculator-settings',
			JSON.stringify({ useUnitPrefixes: this.useUnitPrefixes }),
		);
	}

	constructor() {
		this.load();
	}
}
