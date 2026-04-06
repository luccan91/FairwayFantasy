/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { 
    ignoreBuildErrors: true,
  },
  eslint: { 
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: 'pga-tour-res.cloudinary.com' },
    ],
  },
};

module.exports = nextConfig;
