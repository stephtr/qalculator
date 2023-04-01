import {
	calculate,
	CalculationOptions,
	initializeCalculationModule,
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

	#isLoaded = false;

	get isLoaded() {
		return this.#isLoaded;
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
		const options =
			// eslint-disable-next-line no-bitwise
			(this.settings.useUnitPrefixes ? 0 : CalculationOptions.NoUnits) |
			(this.settings.useDecimalPoint
				? CalculationOptions.DecimalPoint
				: 0);
		let {
			input,
			output,
			messages: rawMessages,
		} = calculate(textInput, timeoutMs, options);
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
		this.submittedListeners.forEach((l) => l(input));
		if (!this.isLoaded) {
			this.pendingCalculationOnceLoaded = input;
			return;
		}
		this.history.add(this.calculate(input));
	}

	constructor() {
		if (typeof window !== 'undefined') {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			initializeCalculationModule().then(() => {
				this.#isLoaded = true;

				this.settings.apply();

				if (this.pendingCalculationOnceLoaded) {
					this.submitCalculation(this.pendingCalculationOnceLoaded);
					this.pendingCalculationOnceLoaded = null;
				}
				this.loadedListeners.forEach((l) => l());
			});
		}
	}
}
