const nextTranslate = require("next-translate-plugin");

/** @type {import('next').NextConfig} */
module.exports = nextTranslate({
  reactStrictMode: true,
  images: { 
    domains: [
      "localhost",
      "127.0.0.1",
      "lastproject-production-0886.up.railway.app",
      process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "localhost"
    ],
  },
  // (i18n.json จะถูกอ่านจาก root โดยอัตโนมัติ)
});
