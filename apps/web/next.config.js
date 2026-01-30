/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stellar-rent/ui'],

  // Suppress ESLint errors during production build to avoid "Unknown options" failure
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  webpack: (config, { _isServer }) => {
    // Fix for node modules and fallback modules
    config.resolve.fallback = { fs: false, net: false, tls: false };

    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      '~': require('node:path').resolve(__dirname, 'src'),
      'sodium-native': 'sodium-universal',
    };

    // Handle native node modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    config.module.unknownContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;
