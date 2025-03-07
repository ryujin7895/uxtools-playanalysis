/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  tailwind: true,
  postcss: true,
  serverDependenciesToBundle: [
    "flowbite",
    "flowbite-react",
    "flowbite-typography",
    "google-play-scraper",
    "natural"
  ],
  browserNodeBuiltinsPolyfill: {
    modules: {
      querystring: true,
      url: true,
      events: true,
      util: true,
      stream: true,
      fs: true,
      http: true,
      https: true,
      dns: true,
      os: true,
      buffer: true,
      zlib: true,
      http2: true,
      tls: true,
      net: true,
      crypto: true,
      path: true,
      string_decoder: true
    }
  }
};
