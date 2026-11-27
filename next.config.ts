import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow this app to be embedded in an iframe on any site.
        // To restrict, replace * with specific origins, e.g. "https://example.sharepoint.com".
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
    ];
  },
};

export default nextConfig;
