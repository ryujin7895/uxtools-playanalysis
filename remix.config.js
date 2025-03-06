/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  tailwind: true,
  postcss: true,
  serverDependenciesToBundle: ["flowbite", "flowbite-react", "flowbite-typography"]
};
