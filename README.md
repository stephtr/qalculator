# Qalculator

<a href="https://www.microsoft.com/store/productId/9P4866X24PD3">
	<img src="website/static/badge-microsoft-store.svg" alt="Get it from Microsoft" height="50" />
</a>
<a href="https://play.google.com/store/apps/details?id=xyz.qalculator.twa">
	<img src="website/static/badge-google-play.png" alt="Get it on Google Play" height="50" />
</a>
<a href="https://apps.apple.com/app/qalculator-xyz/id1611421527">
	<img src="website/static/badge-appstore.png" alt="Get it on Apple AppStore" height="50" />
</a>

A calculator for the web, based on [libqalculate by Hanna Knutsson](https://github.com/Qalculate/libqalculate)

Live at https://qalculator.xyz/
[![Screenshot](website/static/app_screenshot_desktop.png)](https://qalculator.xyz/)

## Development

This repo is split into two parts:

-   `lib` is responsible for building a web assembly based on [`libqalculate`](https://github.com/Qalculate/libqalculate).
-   `website` is the progressive web app (a SvelteKit website)
