/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('faiss-node')
    }
    return config
  },
};

export default nextConfig
