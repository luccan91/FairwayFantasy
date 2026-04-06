/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: 'pga-tour-res.cloudinary.com' },
    ],
  },
};

module.exports = nextConfig;
