/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/auth/admin',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/admin/login',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
