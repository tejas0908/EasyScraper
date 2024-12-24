import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {},
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
