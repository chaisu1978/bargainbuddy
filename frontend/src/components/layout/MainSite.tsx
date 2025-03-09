import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ShoppingLists from "../pages/ShoppingLists";
import ProfilePage from "../pages/ProfilePage";
import HeaderTop from "./HeaderTop";
import Footer from "./Footer";
import AuthGuard from "../common/AuthGuard";

const MainSite = () => {
  return (
    <>
      <HeaderTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/shopping-lists"
          element={
            <AuthGuard>
              <ShoppingLists />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <ProfilePage />
            </AuthGuard>
          }
        />
        {/* Add more routes as needed */}
      </Routes>
      <Footer />
    </>
  );
};

export default MainSite;
