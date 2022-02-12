export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getOS():
	| 'win'
	| 'mac'
	| 'linux'
	| 'android'
	| 'ios'
	| undefined {
	if (typeof navigator === 'undefined') return undefined;
	if (navigator.userAgent.includes('Win')) return 'win';
	if (navigator.userAgent.includes('like Mac')) return 'ios';
	if (navigator.userAgent.includes('Mac')) return 'mac';
	if (navigator.userAgent.includes('Linux')) return 'linux';
	if (navigator.userAgent.includes('Android')) return 'android';
}
