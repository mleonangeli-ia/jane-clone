import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stripe webhook needs raw body — Next.js App Router handles this natively
};

export default nextConfig;
