/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid intermittent corrupted module cache in Windows dev sessions.
      config.cache = false
    }
    return config
  },
}

export default nextConfig
