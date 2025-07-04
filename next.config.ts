import type {NextConfig} from 'next';
import createWithNextIntl from 'next-intl/plugin';

const withNextIntl = createWithNextIntl();

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['*.cloudworkstations.dev'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
