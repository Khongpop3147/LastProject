const nextTranslate = require("next-translate-plugin");

/** @type {import('next').NextConfig} */
module.exports = nextTranslate({
  reactStrictMode: true,
  swcMinify: true,
  compress: true,

  images: { 
    formats: ['image/avif', 'image/webp'],
    domains: [
      "localhost",
      "127.0.0.1",
      "lastproject-production-0886.up.railway.app",
      process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "localhost"
    ],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
  
  // Enable optimizations
  poweredByHeader: false,
  // (i18n.json จะถูกอ่านจาก root โดยอัตโนมัติ)
});
