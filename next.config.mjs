import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@swisseph/node"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@swisseph/node/**/*",
      "./node_modules/@swisseph/core/**/*",
      "./node_modules/node-gyp-build/**/*",
      "./node_modules/node-addon-api/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};
export default nextConfig;
