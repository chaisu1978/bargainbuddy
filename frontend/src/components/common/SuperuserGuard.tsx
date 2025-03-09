import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { RootState } from "../../store";
import { useLocation } from "react-router-dom";

const SuperuserGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const location = useLocation();

  console.log("SuperuserGuard - Current User State:", user);

  // 🚀 If Redux hasn't loaded user info yet, don't redirect; just return null.
  if (!isAuthenticated || user === null) {
    console.log("SuperuserGuard - User not yet loaded, waiting...");
    return null; // This prevents premature redirection
  }

  if (!user.is_superuser) {
    console.log("SuperuserGuard - User is not superuser, redirecting...");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  console.log("SuperuserGuard - Access granted!");
  return <>{children}</>;
};

export default SuperuserGuard;
