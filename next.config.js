const nextTranslate = require("next-translate-plugin");

/** @type {import('next').NextConfig} */
module.exports = nextTranslate({
  reactStrictMode: true,
  swcMinify: true,
  images: { domains: [] },
  // (i18n.json จะถูกอ่านจาก root โดยอัตโนมัติ)
});
