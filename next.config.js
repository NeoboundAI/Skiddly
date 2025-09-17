/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable source maps for client-side code in production
  productionBrowserSourceMaps: true,

  // Custom webpack configuration for enhanced debugging
  webpack: (config, { dev, isServer, buildId }) => {
    // Enable source maps for both development and production
    if (dev) {
      config.devtool = "cheap-module-source-map";
    } else {
      // Production source maps for both client and server
      config.devtool = isServer ? "source-map" : "hidden-source-map";
    }

    // Enhanced error reporting
    config.stats = {
      errorDetails: true,
      colors: true,
      chunks: false,
      modules: false,
      children: false,
    };

    // Preserve original file names in stack traces
    config.optimization = {
      ...config.optimization,
      moduleIds: dev ? "named" : "deterministic",
      chunkIds: dev ? "named" : "deterministic",
    };

    return config;
  },
};

export default nextConfig;
