import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'npkqvhdsyyxphcinhcej.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'notioncreativeart.com',
      },
    ],
  },
  // Allow Supabase storage URLs and external product images
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

export default nextConfig
