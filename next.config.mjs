/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["@react-pdf/renderer"],

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "res.cloudinary.com" },
    ],
  },

  experimental: {
    // Tree-shake barrel imports — avoids loading the full lucide-react / recharts bundles
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-popover",
    ],
  },
};

export default nextConfig;
