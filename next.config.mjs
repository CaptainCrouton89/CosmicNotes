import { GenerateSW } from "workbox-webpack-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
  // Enable Turbopack for development builds only
  experimental: {
    turbo: {
      // Turbopack specific options
      rules: {
        // Custom rules for Turbopack processing
      },
      // When running in dev mode with --turbopack flag, these webpack plugins won't run
      // They will still be applied during the production build
    },
  },
  // Configure webpack for production builds and when not using Turbopack
  webpack: (config, { isServer, dev }) => {
    // Only apply these plugins in production or when not using Turbopack
    if (!isServer && (!dev || process.env.NEXT_TURBO !== "true")) {
      config.plugins.push(
        new GenerateSW({
          swDest: "public/sw.js",
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "google-fonts-stylesheets",
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com/,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
            {
              urlPattern: /\.(?:js|css)$/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "static-resources",
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images",
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /api/,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-responses",
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60, // 1 hour
                },
              },
            },
            {
              urlPattern: /./,
              handler: "NetworkFirst",
              options: {
                cacheName: "others",
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
              },
            },
          ],
        })
      );
    }
    return config;
  },
};

export default nextConfig;
