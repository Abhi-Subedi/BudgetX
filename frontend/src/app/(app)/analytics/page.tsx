import { Suspense } from "react";

import AnalyticsPage from "../../../views/AnalyticsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPage />
    </Suspense>
  );
}
