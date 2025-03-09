import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// ✅ Lazy Load Components
const UserManagement = lazy(() => import("./UserManagement"));
const ProductManagement = lazy(() => import("./ProductManagement"));
const StoreManagement = lazy(() => import("./StoreManagement"));
const PriceListingManagement = lazy(() => import("./PriceListingManagement"));
const MTIDataImport = lazy(() => import("./MTIDataImport"));

export default function WebminPageContent({ pathname }: { pathname: string }) {
  let PageComponent;

  // ✅ Route Matching
  switch (pathname) {
    case "/users":
      PageComponent = UserManagement;
      break;
    case "/products":
      PageComponent = ProductManagement;
      break;
    case "/stores":
      PageComponent = StoreManagement;
      break;
    case "/prices":
      PageComponent = PriceListingManagement;
      break;
    case "/dataimport/mtidataimport":
      PageComponent = MTIDataImport;
      break;
    default:
      PageComponent = () => (
        <Typography variant="h6" sx={{ textAlign: "center" }}>
          Select a section from the menu
        </Typography>
      );
  }

  return (
    <Box sx={{ py: 1, px: 2 }}>
      <Suspense fallback={<Typography>Loading...</Typography>}>
        <PageComponent />
      </Suspense>
    </Box>
  );
}
