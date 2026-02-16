import type { GetServerSideProps } from "next";

export default function LegacyAddressRouteRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const destination =
    query.from === "checkout"
      ? "/account/addresses/select?from=checkout"
      : "/account/addresses/select";

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};
