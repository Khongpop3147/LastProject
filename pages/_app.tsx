// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import Head from "next/head";

// เปลี่ยนเป็น import จาก next-translate-plugin
import appWithI18n from "next-translate/appWithI18n";
import i18nConfig from "../i18n.json";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

// ห่อด้วย HOC จาก plugin
export default appWithI18n(MyApp as any, i18nConfig);
