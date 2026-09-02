import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
