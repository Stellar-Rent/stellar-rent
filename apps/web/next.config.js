/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stellar-rent/ui'],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': require('node:path').resolve(__dirname, 'src'),
    };

    // Configuración para manejar módulos nativos
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Configuración para manejar dependencias dinámicas
    config.module.unknownContextCritical = false;

    // Configuración específica para el SDK de Stellar
    config.resolve.alias = {
      ...config.resolve.alias,
      'sodium-native': 'sodium-universal',
    };

    return config;
  },
};

module.exports = nextConfig;
