import {
	calculate,
	initializeCalculationModule,
	setOption,
	updateCurrencyValues,
} from './calculatorModule';
import { History } from './history';
import { Settings } from './settings';

type Severity = 'error' | 'warning' | 'info';

export interface Calculation {
	id: string;
	input: string;
	rawInput: string;
	output: string;
	messages: string[];
	severity: Severity | null;
	isBookmarked?: boolean;
	bookmarkName?: string;
}

export interface CurrencyData {
	base: string;
	date: string;
	rates: Record<string, string>;
}

/** Parses the status message coming from Web Assembly */
function parseCalculationMessages(messagesString: string): {
	messages: string[];
	severity: Severity | null;
} {
	const messages = messagesString.split('\n');
	let severity: Severity | null = null;
	if (messages.find((m) => m.startsWith('Error'))) {
		severity = 'error';
	} else if (messages.find((m) => m.startsWith('Warning'))) {
		severity = 'warning';
	} else if (messages.length > 0) {
		severity = 'info';
	}
	return {
		messages: messages.map((m) => m.replace(/^(Error|Warning|Info): /, '')),
		severity,
	};
}

export class Calculator {
	history = new History();

	settings = new Settings();

	private _isLoaded = false;

	get isLoaded() {
		return this._isLoaded;
	}

	private loadedListeners: Array<() => void> = [];

	/** adds a callback which gets executed when qalculator has finished loading */
	addOnLoadedListener(listener: () => void) {
		if (this.isLoaded) {
			listener();
			return;
		}
		this.loadedListeners.push(listener);
	}

	removeOnLoadedListener(listener: () => void) {
		this.loadedListeners = this.loadedListeners.filter(
			(l) => l !== listener,
		);
	}

	private submittedListeners: Array<(calculation: string) => void> = [];

	/** adds a callback which gets executed whenever a calculation is submitted */
	addOnCalculationListener(listener: (calculation: string) => void) {
		this.submittedListeners.push(listener);
	}

	removeOnCalculationListener(listener: (calculation: string) => void) {
		this.submittedListeners = this.submittedListeners.filter(
			(l) => l !== listener,
		);
	}

	calculate(textInput: string, timeoutMs: number = 500): Calculation {
		let {
			input,
			output,
			messages: rawMessages,
		} = calculate(textInput, timeoutMs);
		let { messages, severity } = parseCalculationMessages(rawMessages);
		if (output === 'timed out') {
			messages = ['Calculation timed out'];
			severity = 'error';
			output = '';
		}
		return {
			id: Math.random().toString(),
			input,
			rawInput: textInput,
			output,
			messages,
			severity,
		};
	}

	private pendingCalculationOnceLoaded: string | null = null;

	submitCalculation(input: string) {
		const isSetCommand = input.startsWith('set ');
		if (!isSetCommand) {
			this.submittedListeners.forEach((l) => l(input));
		}
		if (!this.isLoaded) {
			this.pendingCalculationOnceLoaded = input;
			return;
		}

		if (isSetCommand) {
			setOption(input.slice(4));
		} else {
			this.history.add(this.calculate(input));
		}
	}

	private pendingCurrencyData: CurrencyData | null = null;

	private lastCurrencyUpdateDate: number = 0;

	updateCurrencyData(data: CurrencyData) {
		const newDate = +new Date(data.date);
		if (this.lastCurrencyUpdateDate >= newDate) return;
		this.lastCurrencyUpdateDate = newDate;

		if (!this.isLoaded) {
			this.pendingCurrencyData = data;
			return;
		}
		updateCurrencyValues(
			Object.entries(data.rates).map(([name, value]) => ({
				name,
				value,
			})),
			data.base,
			new Date(data.date),
		);
	}

	constructor() {
		if (typeof window !== 'undefined') {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			initializeCalculationModule().then(() => {
				this._isLoaded = true;

				this.settings.apply();

				if (this.pendingCurrencyData) {
					this.updateCurrencyData(this.pendingCurrencyData);
					this.pendingCurrencyData = null;
				}

				if (this.pendingCalculationOnceLoaded) {
					this.submitCalculation(this.pendingCalculationOnceLoaded);
					this.pendingCalculationOnceLoaded = null;
				}
				this.loadedListeners.forEach((l) => l());
			});
		}
	}
}
