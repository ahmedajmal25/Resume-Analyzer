import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) ships worker files that need to stay on disk
  // in node_modules rather than get bundled into a serverless chunk.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
