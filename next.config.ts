import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repository's `pages/*.js` files belong to the WeChat mini program,
  // not to Next.js. Restrict web routes to TypeScript files.
  pageExtensions: ["ts", "tsx"]
};

export default nextConfig;
