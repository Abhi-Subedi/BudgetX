import { Suspense } from "react";

import TransactionsPage from "../../../views/TransactionsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TransactionsPage />
    </Suspense>
  );
}
