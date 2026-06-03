import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/stripe/webhook",
        headers: [{ key: "Content-Type", value: "text/plain" }],
      },
    ]
  },
}

export default nextConfig
