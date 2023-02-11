interface Example {
	input: string;
	rawInput: string;
}

export const examples: { category: string; examples: Example[] }[] = [
	{
		category: 'Basic functions and operators',
		examples: [
			{
				input: 'sqrt(<span style="color:#AAFFFF">25</span>; <span style="color:#AAFFFF">16</span>; <span style="color:#AAFFFF">9</span>; <span style="color:#AAFFFF">4</span>)',
				rawInput: 'sqrt(25; 16; 9; 4)',
			},
			{
				input: '(−<span style="color:#AAFFFF">27</span>)<sup>(<span style="color:#AAFFFF">1</span>∕<span style="color:#AAFFFF">3)</sup>',
				rawInput: '(-27)^(1/3)',
			},
			{
				input: '<span style="color:#AAFFFF">52</span> to factors',
				rawInput: '52 to factors',
			},
			{
				input: 'gcd(<span style="color:#AAFFFF">63</span>; <span style="color:#AAFFFF">27</span>)',
				rawInput: 'gcd(63; 27)',
			},
			{
				input: 'sum(<span style="color:#FFFFAA"><i>x</i></span>; <span style="color:#AAFFFF">1</span>; <span style="color:#AAFFFF">5</span>)',
				rawInput: 'sum(x; 1; 5)',
			},
			{
				input: 'sum(<span style="color:#FFFFAA"><i>\\i</i></span><sup><span style="color:#AAFFFF">2</span></sup> + sin(<span style="color:#FFFFAA"><i>\\i</i></span>); <span style="color:#AAFFFF">1</span>; <span style="color:#AAFFFF">5</span>)',
				rawInput: 'sum(\\i^2+sin(\\i); 1; 5; \\i)',
			},
			{
				input: 'product(<span style="color:#FFFFAA"><i>x</i></span>; <span style="color:#AAFFFF">1</span>; <span style="color:#AAFFFF">5</span>)',
				rawInput: 'product(x; 1; 5)',
			},
			{
				input: 'var1 = <span style="color:#AAFFFF">5</span>',
				rawInput: 'var1 = 5',
			},
			{
				input: '<span style="color:#AAFFFF">2</span> ⋅ <span style="color:#FFFFAA">var1</span>',
				rawInput: '2 * var1',
			},
		],
	},
	{
		category: 'Units',
		examples: [
			{
				input: '<span style="color:#AAFFFF">5</span> <span style="color:#BBFFBB">dm<sup>3</sup></span> to <span style="color:#BBFFBB">l</span>',
				rawInput: '5 dm³ to l',
			},
			{
				input: '<span style="color:#AAFFFF">20</span> <span style="color:#BBFFBB">miles</span> ∕ <span style="color:#AAFFFF">2</span> <span style="color:#BBFFBB">hours</span> to <span style="color:#BBFFBB">km/h</span>',
				rawInput: '20 miles / 2h to km/h',
			},
			{
				input: '<span style="color:#AAFFFF">1,74</span> <span style="color:#BBFFBB">m</span> to <span style="color:#BBFFBB">ft</span>',
				rawInput: '1.74 to ft',
			},
			{
				input: '<span style="color:#AAFFFF">1,74</span> <span style="color:#BBFFBB">m</span> to -<span style="color:#BBFFBB">ft</span>',
				rawInput: '1.74 to -ft',
			},
			{
				input: '<span style="color:#AAFFFF">50</span> <span style="color:#BBFFBB">Ω</span> ⋅ <span style="color:#AAFFFF">2</span> <span style="color:#BBFFBB">A</span>',
				rawInput: '50 Ohm * 2 A',
			},
			{
				input: '<span style="color:#AAFFFF">50</span> <span style="color:#BBFFBB">Ω</span> ⋅ <span style="color:#AAFFFF">2</span> <span style="color:#BBFFBB">A</span> to base',
				rawInput: '50 Ohm * 2 A to base',
			},
			{
				input: '<span style="color:#AAFFFF">10</span> <span style="color:#BBFFBB">N</span> ⋅ <span style="color:#AAFFFF">5</span> <span style="color:#BBFFBB">Pa</span>',
				rawInput: '10 N / 5 Pa',
			},
		],
	},
	{
		category: 'Physical constants',
		examples: [
			{
				input: '<span style="color:#FFFFAA">planck</span> ∕ (<span style="color:#FFFFAA">lambda_C</span> ⋅ <span style="color:#FFFFAA">c</span>)',
				rawInput: 'planck / (lambda_C * c)',
			},
			{
				input: 'atom(<span style="color:#FFFFAA"><i>Hg</i></span>; <span style="color:#FFFFAA"><i>weight</i></span>) + atom(<span style="color:#FFFFAA"><i>C</i></span>; <span style="color:#FFFFAA"><i>weight</i></span>) ⋅ <span style="color:#AAFFFF">4</span> to <span style="color:#BBFFBB">g</span>',
				rawInput: 'atom(Hg; weight) + atom(C; weight) × 4 to g',
			},
			{
				input: '<span style="color:#FFFFAA">G</span> ⋅ planet(<span style="color:#FFFFAA"><i>earth</i></span>; <span style="color:#FFFFAA"><i>mass</i></span>) ⋅ planet(<span style="color:#FFFFAA"><i>mars</i></span>; <span style="color:#FFFFAA"><i>mass</i></span>) ∕ (<span style="color:#AAFFFF">54,6e6</span> <span style="color:#BBFFBB">km</span>)<sup><span style="color:#AAFFFF">2</span></sup>',
				rawInput:
					'G * planet(earth; mass) * planet(mars; mass) / (54.6e6 km)^2',
			},
		],
	},
	{
		category: 'Uncertainty and interval arithmetic',
		examples: [
			{
				input: 'sin(<span style="color:#AAFFFF">5</span> +/- <span style="color:#AAFFFF">0,2</span>)<sup><span style="color:#AAFFFF">2</span></sup> ∕ (<span style="color:#AAFFFF">2</span> +/- <span style="color:#AAFFFF">0,3</span>)',
				rawInput: 'sin(5 +/- 0.2)^2 / 2 +/- 0.3',
			},
			{
				input: '(<span style="color:#AAFFFF">2</span> +/- <span style="color:#AAFFFF">0,02</span> <span style="color:#BBFFBB">J</span>) ∕ (<span style="color:#AAFFFF">523</span> +/- <span style="color:#AAFFFF">5</span> <span style="color:#BBFFBB">W</span>)',
				rawInput: '(2 +/- 0.02 J) / (523 +/- 5 W)',
			},
		],
	},
	{
		category: 'Algebra',
		examples: [
			{
				input: '(<span style="color:#AAFFFF">5</span><span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup> + <span style="color:#AAFFFF">2</span>) ∕ (<span style="color:#FFFFAA"><i>x</i></span> − <span style="color:#AAFFFF">3</span>)',
				rawInput: '(5x^2 + 2) / (x − 3)',
			},
			{
				input: '(<span style="color:#FFFFAA"><i>\\a</i></span> + <span style="color:#FFFFAA"><i>\\b</i></span>) ⋅ (<span style="color:#FFFFAA"><i>\\a</i></span> − <span style="color:#FFFFAA"><i>\\b</i></span>)',
				rawInput: '(\\a + \\b)(\\a − \\b)',
			},
			{
				input: 'factorize <span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">4</span></sup> − <span style="color:#AAFFFF">7</span><span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">3</span></sup> + <span style="color:#AAFFFF">9</span><span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup> + <span style="color:#AAFFFF">27</span><span style="color:#FFFFAA"><i>x</i></span> − <span style="color:#AAFFFF">54</span>',
				rawInput: 'factorize x^4 − 7x^3 + 9x^2 + 27x − 54',
			},
			{
				input: 'gcd(<span style="color:#AAFFFF">25</span><span style="color:#FFFFAA"><i>x</i></span>; <span style="color:#AAFFFF">5</span><span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup>)',
				rawInput: 'gcd(25x; 5x^2)',
			},
			{
				input: '<span style="color:#AAFFFF">1</span> ∕ (<span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup> + <span style="color:#AAFFFF">2</span><span style="color:#FFFFAA"><i>x</i></span> − <span style="color:#AAFFFF">3</span>) to partial fraction',
				rawInput: '1 / (x^2 + 2x − 3) to partial fraction',
			},
			{
				input: '<span style="color:#FFFFAA"><i>x</i></span> + <span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup> + <span style="color:#AAFFFF">4</span> = <span style="color:#AAFFFF">16</span>',
				rawInput: 'x + x^2 + 4 = 16',
			},
			{
				input: '<span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup> ∕ (<span style="color:#AAFFFF">5</span> <span style="color:#BBFFBB">m</span>) − hypot(<span style="color:#FFFFAA"><i>x</i></span>; <span style="color:#AAFFFF">4</span> <span style="color:#BBFFBB">m</span>) = <span style="color:#AAFFFF">2</span> <span style="color:#BBFFBB">m</span> where <span style="color:#FFFFAA"><i>x</i></span> > <span style="color:#AAFFFF">0</span>',
				rawInput: 'x^2/(5 m) − hypot(x; 4 m) = 2 m where x > 0',
			},
			{
				input: '<span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup> &gt; <span style="color:#AAFFFF">25</span><span style="color:#FFFFAA"><i>x</i></span>',
				rawInput: 'x^2 > 25x',
			},
			{
				input: 'solve(<span style="color:#FFFFAA"><i>x</i></span> = <span style="color:#FFFFAA"><i>y</i></span> + ln(<span style="color:#FFFFAA"><i>y</i></span>); <span style="color:#FFFFAA"><i>y</i></span>)',
				rawInput: 'solve(x = y+ln(y); y)',
			},
			{
				input: 'solve2(<span style="color:#AAFFFF">5</span><span style="color:#FFFFAA"><i>x</i></span> = <span style="color:#AAFFFF">2</span><span style="color:#FFFFAA"><i>y</i></span><sup><span style="color:#AAFFFF">2</span></sup>; sqrt(<span style="color:#FFFFAA"><i>y</i></span>) = <span style="color:#AAFFFF">2</span>)',
				rawInput: 'solve2(5x=2y^2; sqrt(y)=2; x; y)',
			},
			{
				input: 'multisolve([<span style="color:#AAFFFF">5</span><span style="color:#FFFFAA"><i>x</i></span> = <span style="color:#AAFFFF">2</span><span style="color:#FFFFAA"><i>y</i></span> + <span style="color:#AAFFFF">32</span>, <span style="color:#FFFFAA"><i>y</i></span> = <span style="color:#AAFFFF">2</span><span style="color:#FFFFAA"><i>z</i></span>, <span style="color:#FFFFAA"><i>z</i></span> = <span style="color:#AAFFFF">2</span><span style="color:#FFFFAA"><i>x</i></span>]; [<span style="color:#FFFFAA"><i>x</i></span>, <span style="color:#FFFFAA"><i>y</i></span>, <span style="color:#FFFFAA"><i>z</i></span>])',
				rawInput: 'multisolve([5x=2y+32, y=2z, z=2x]; [x, y, z])',
			},
			{
				input: 'dsolve(d/d<span style="color:#FFFFAA"><i>x</i></span>(<span style="color:#FFFFAA"><i>y</i></span>) − <span style="color:#AAFFFF">2</span><span style="color:#FFFFAA"><i>y</i></span> = <span style="color:#AAFFFF">4</span><span style="color:#FFFFAA"><i>x</i></span>; <span style="color:#AAFFFF">5</span>)',
				rawInput: 'dsolve(d/dx(y) − 2y = 4x; 5)',
			},
		],
	},
	{
		category: 'Calculus',
		examples: [
			{
				input: 'diff(<span style="color:#AAFFFF">6</span><span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup>)',
				rawInput: 'diff(6x^2)',
			},
			{
				input: 'diff(<span style="color:#FFFFAA"><i>x</i></span> ⋅ sinh(<span style="color:#FFFFAA"><i>y</i></span><sup><span style="color:#AAFFFF">2</span></sup>) ∕ <span style="color:#FFFFAA"><i>y</i></span>; <span style="color:#FFFFAA"><i>y</i></span>)',
				rawInput: 'diff(x * sinh(y^2) / y; y)',
			},
			{
				input: 'integrate(<span style="color:#AAFFFF">6</span><span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup>)',
				rawInput: 'integrate(6x^2)',
			},
			{
				input: 'integrate(<span style="color:#AAFFFF">6</span><span style="color:#FFFFAA"><i>x</i></span><sup><span style="color:#AAFFFF">2</span></sup>; <span style="color:#AAFFFF">1</span>; <span style="color:#AAFFFF">5</span>)',
				rawInput: 'integrate(6x^2; 1; 5)',
			},
			{
				input: 'limit(ln(<span style="color:#AAFFFF">1</span> + <span style="color:#AAFFFF">4</span><span style="color:#FFFFAA"><i>x</i></span>) ∕ (<span style="color:#AAFFFF">3</span><sup><span style="color:#FFFFAA"><i>x</i></span></sup> − <span style="color:#AAFFFF">1</span>); <span style="color:#AAFFFF">0</span>)',
				rawInput: 'limit(ln(1 + 4x)/(3^x − 1); 0)',
			},
			{
				input: '<span style="color:#AAFFFF">10:31</span> + <span style="color:#AAFFFF">8:30</span> to time',
				rawInput: '10:31 + 8:30 to time',
			},
			{
				input: '<span style="color:#AAFFFF">"2020-07-10T08:50:00"</span> to utc+8',
				rawInput: '"2020-07-10T07:50CET" to utc+8',
			},
			{
				input: '<span style="color:#FFFFAA">today</span> − <span style="color:#AAFFFF">5</span> <span style="color:#BBFFBB">days</span>',
				rawInput: 'today − 5 days',
			},
		],
	},
	{
		category: 'Number bases',
		examples: [
			{
				input: '<span style="color:#AAFFFF">52</span> to bin',
				rawInput: '52 to bin',
			},
			{
				input: '<span style="color:#AAFFFF">52</span> to bin16',
				rawInput: '52 to bin16',
			},
			{
				input: '<span style="color:#AAFFFF">52.345</span> to float',
				rawInput: '52.345 to float',
			},
			{
				input: '<span style="color:#AAFFFF">52.34</span> to sexa',
				rawInput: '52.34 to sexa',
			},
		],
	},
];
