import type { GetServerSideProps } from "next";

export default function AccountSettingsRedirectPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/account/settings/payment",
      permanent: false,
    },
  };
};
