import type { Writable } from 'svelte/store';
import type { Calculator } from './calculator';

export const calculatorKey = Symbol('calculator');

export interface CalculatorContext {
	calculator: Calculator;
	selectCalculation: Writable<(calc: string) => void>;
	aboutToSelectCalculation: Writable<() => void>;
	submitOnBlur: Writable<boolean>;
	updateCurrentResult: Writable<() => void>;
	autofocus: Writable<boolean>;
}
