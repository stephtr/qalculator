/// <reference types="@sveltejs/kit" />

declare const Module: any;

declare global {
	namespace App {
		interface Platform {
			env: {
				CACHE: any;
			};
		}
	}
}

export {};
