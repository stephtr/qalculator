import withSerwistInit from "@serwist/next";
import nextBuildId from "next-build-id";
import libqalculatePackageJson from "./node_modules/libqalculate-wasm/package.json" assert { type: "json" };

const buildId = await nextBuildId({ dir: import.meta.dirname });
const libqalculateVersion = libqalculatePackageJson.version;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BUILD_ID_ENV: buildId,
  },
};

const urlsToCache = ["/", "/logo.png", '/api/getCurrencyData'];

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: false,
  additionalPrecacheEntries: [
    {
      url: "/libqalculate.wasm",
      revision: libqalculateVersion,
    },
    ...urlsToCache.map((url) => ({ url, revision: buildId })),
  ],
});

export default withSerwist(nextConfig);
