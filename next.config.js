/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable source maps in production for better error debugging
  productionBrowserSourceMaps: true,

  // Enable source maps for server-side code too
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in both development and production
    if (!dev) {
      config.devtool = "source-map";
    }
    return config;
  },

 
    serverComponentsExternalPackages: ["mongoose"],
 
};

export default nextConfig;
