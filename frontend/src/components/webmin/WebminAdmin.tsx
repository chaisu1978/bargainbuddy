import { useDemoRouter } from "@toolpad/core/internal";
import { AppProvider, type Navigation } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import lightTheme from "../../themes/lightTheme";
import darkTheme from "../../themes/darkTheme";
import ToolbarActions from "./ToolbarActions";
import WebminPageContent from "./WebminPageContent";
import {
  Dashboard,
  People,
  ShoppingBag,
  Storefront,
  LocalOffer,
  Assessment,
  Schema,
  CloudUpload,
  Layers,
} from "@mui/icons-material";

const NAVIGATION: Navigation = [
  { kind: "header", title: "Tools" },
  { segment: "dashboard", title: "Dashboard", icon: <Dashboard /> },
  { segment: "users", title: "Users", icon: <People /> },
  { segment: "products", title: "Products", icon: <ShoppingBag /> },
  { segment: "stores", title: "Stores", icon: <Storefront /> },
  { segment: "prices", title: "Prices", icon: <LocalOffer /> },
  { kind: "divider" },
  { kind: "header", title: "Data Management" },
  {
    segment: "dataimport",
    title: "Data Import",
    icon: <Schema />,
    children: [
      {
        segment: "mtidataimport",
        title: "MTI Data Import",
        icon: <CloudUpload />,
      },
      {
        segment: "mtiimportlogs",
        title: "MTI Import Logs",
        icon: <Assessment />,
      },
    ],
  },
  { segment: "integrations", title: "Integrations", icon: <Layers /> },
];

export default function DashboardLayoutBasic(props: { window?: () => Window }) {
  const { window } = props;
  const router = useDemoRouter("/dashboard");
  const demoWindow = window !== undefined ? window() : undefined;
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const branding = {
    homeUrl: "/",
    logo: (
      <img
        src={
          isDarkMode
            ? "/assets/logos/small-light-logo.svg"
            : "/assets/logos/small-dark-logo.svg"
        }
        alt="Webmin Logo"
        style={{ height: 40, width: "auto" }}
      />
    ),
    title: "Webmin",
  };

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      theme={isDarkMode ? darkTheme : lightTheme}
      window={demoWindow}
    >
      <DashboardLayout
        slotProps={{ appTitle: { branding } }}
        slots={{ toolbarActions: ToolbarActions }}
      >
        <WebminPageContent pathname={router.pathname} />
      </DashboardLayout>
    </AppProvider>
  );
}
