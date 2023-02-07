# Qalculator

<a href="https://www.microsoft.com/store/productId/9P4866X24PD3">
	<img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Download from Microsoft" height="50" />
</a>
<a href="https://play.google.com/store/apps/details?id=xyz.qalculator.twa">
	<img alt="Get it on Google Play" src=".github/google-play-badge.png" height="50" />
</a>
<a href="https://apps.apple.com/app/qalculator-xyz/id1611421527">
	<img alt="Get it on Google Play" src=".github/appstore-badge.png" height="50" />
</a>

A calculator for the web, based on [libqalculate by Hanna Knutsson](https://github.com/Qalculate/libqalculate)

![Screenshot](website/static/app_screenshot_desktop.png)

## Development

This repo is split into two parts:

-   `lib` is responsible for building a web assembly based on `libqalculate`.
-   `website` is the progressive web app (a SvelteKit website)
