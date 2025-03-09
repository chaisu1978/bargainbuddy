import { useDispatch, useSelector } from "react-redux";
import { Switch } from "@mui/material";
import { toggleTheme } from "../../store/themeSlice";
import { RootState } from "../../store";
import { FaMoon, FaSun } from "react-icons/fa";
import apiClient from "../../services/auth";

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const handleToggleTheme = () => {
    const newTheme = !isDarkMode ? "dark" : "light";

    // Update theme in the backend
    apiClient
      .patch("/core/me/", { theme_mode: newTheme })
      .then(() => {
        dispatch(toggleTheme()); // Update the Redux state
        console.log("Theme updated successfully.");
      })
      .catch((err) => {
        console.error("Failed to update theme:", err);
      });
  };

  return (
    <Switch
      checked={isDarkMode}
      onChange={handleToggleTheme}
      name="themeToggle"
      size="medium"
      color="primary"
      checkedIcon={<FaMoon size={20} />}
      icon={<FaSun fill="yellow" size={20} />}
    />
  );
};

export default ThemeToggle;
