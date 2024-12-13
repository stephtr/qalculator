import withSerwistInit from "@serwist/next";
import nextBuildId from "next-build-id";

const buildId = await nextBuildId({ dir: import.meta.dirname });

/** @type {import('next').NextConfig} */
const nextConfig = {};

const urlsToCache = ["/", "/api/getCurrencyData"];

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: false,
  additionalPrecacheEntries: urlsToCache.map((url) => ({
    url,
    revision: buildId,
  })),
});

export default withSerwist(nextConfig);
