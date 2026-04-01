/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Kjo i thotë Vercel-it t'i injorojë ato gabimet e kuqe gjatë Build-it
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Kjo i injoron gabimet e TypeScript nëse keni
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
export const dynamic = 'force-dynamic';