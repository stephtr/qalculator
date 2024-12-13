import type { MathfieldElement } from "mathlive";
import type { KVNamespace } from "@cloudflare/workers-types/2023-07-01";

declare global {
	namespace React.JSX {
		interface IntrinsicElements {
			"math-field": React.DetailedHTMLProps<
				MathfieldElement & MathfieldElement<MathfieldElement>,
				MathfieldElement
			>;
		}
	}

	namespace NodeJS {
		interface ProcessEnv {
			CACHE: KVNamespace;
		}
	}
}
