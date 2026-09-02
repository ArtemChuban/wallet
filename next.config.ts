import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep native better-sqlite3 out of Turbopack/webpack bundles (npm run dev).
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/prisma/**/*",
      "./node_modules/@prisma/**/*",
      "./node_modules/better-sqlite3/**/*",
      "./src/generated/prisma/**/*",
    ],
  },
};

export default nextConfig;
