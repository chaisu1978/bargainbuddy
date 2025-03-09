import React, { useState } from "react";
import {
  Container,
  CssBaseline,
  Toolbar,
  Box,
  Button,
  Avatar,
  AppBar,
  Menu,
  MenuItem,
  Badge,
  IconButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { styled } from "@mui/system";
import {
  FaCaretDown,
  FaUser,
  FaKey,
  FaSignOutAlt,
  FaRegLightbulb,
} from "react-icons/fa";
import ThemeToggle from "../common/ThemeToggle";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { logout } from "../../store/authSlice";
import { Link, useNavigate } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import horizontalLightLogo from "../../assets/logos/horizontal-light.svg";
import horizontalColorLogo from "../../assets/logos/horizontal-color.svg";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: theme.palette.secondary.main, // Use secondary color
    color: theme.palette.secondary.contrastText,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    borderRadius: "50%",
    height: "20px",
    width: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}));

function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function stringToContrastColor(string: string) {
  const hex = stringToColor(string);
  const contrastHex = hex.replace("#", "");
  const r = parseInt(contrastHex.substr(0, 2), 16);
  const g = parseInt(contrastHex.substr(2, 2), 16);
  const b = parseInt(contrastHex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

function stringAvatar(firstName: string = "", lastName: string = "") {
  return {
    sx: {
      bgcolor: stringToColor(`${firstName} ${lastName}`.trim() || "User"), // Combine names directly
      color: "white", // Adjust text color if needed
    },
    children: `${firstName[0]?.toUpperCase() || ""}${
      lastName[0]?.toUpperCase() || ""
    }`, // Generate initials
  };
}

const HeaderTop = () => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // Redirect to the home page after logging out
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate("/profile");
    handleMenuClose();
  };

  const handleChangePasswordClick = () => {
    navigate("/change-password");
    handleMenuClose();
  };

  const logoSrc = isSmallScreen
    ? isDarkMode
      ? horizontalLightLogo
      : horizontalColorLogo
    : isDarkMode
      ? horizontalLightLogo
      : horizontalColorLogo;

  return (
    <>
      <CssBaseline />
      <AppBar
        position="sticky"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar
          sx={{
            backgroundColor: "primary.main",
            justifyContent: "space-between",
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left Section: Logo */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
              <Link to="/">
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{
                    height: isSmallScreen ? "52px" : "52px",
                    marginLeft: isSmallScreen ? "0px" : "8px",
                    marginTop: "10px",
                    marginBottom: "10px",
                  }}
                />
              </Link>
            </Box>

            {/* Right Section: User Menu */}
            <Box sx={{ display: "flex", alignItems: "end", gap: 0 }}>
              {!isAuthenticated ? (
                <>
                  <Button
                    color="inherit"
                    size="small"
                    variant="text"
                    component={Link}
                    type="text"
                    to="/login"
                  >
                    Log In
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    variant="text"
                    component={Link}
                    type="text"
                    to="/sign-up"
                  >
                    Sign Up
                  </Button>
                </>
              ) : (
                <>
                  <IconButton onClick={handleMenuClick} sx={{ padding: 0 }}>
                    <StyledBadge
                      overlap="circular"
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      badgeContent={<FaCaretDown fontSize="small" />}
                    >
                      <Avatar
                        alt={user?.email || "User"}
                        {...(user?.profile_picture
                          ? { src: user.profile_picture } // Use profile picture if available
                          : stringAvatar(
                              user?.first_name || "",
                              user?.last_name || ""
                            ))} // Fallback to initials
                        sx={{
                          height: "45px",
                          width: "45px",
                          border: "2px solid",
                          borderColor: "secondary.main",
                          backgroundColor: stringToColor(
                            `${user?.first_name} ${user?.last_name}`.trim() ||
                              "User"
                          ),
                          color: stringToContrastColor(
                            `${user?.first_name} ${user?.last_name}`.trim() ||
                              "User"
                          ),
                        }}
                      />
                    </StyledBadge>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    MenuListProps={
                      {
                        // sx: {
                        //   backgroundColor: "secondary.main",
                        // },
                      }
                    }
                  >
                    <MenuItem
                      onClick={handleProfileClick}
                      sx={{
                        justifyContent: "flex-start",
                      }}
                    >
                      <ListItemIcon>
                        <FaUser />
                      </ListItemIcon>
                      <ListItemText primary="Profile & Settings" />
                    </MenuItem>
                    <MenuItem
                      onClick={handleChangePasswordClick}
                      sx={{
                        justifyContent: "flex-start",
                      }}
                    >
                      <ListItemIcon>
                        <FaKey />
                      </ListItemIcon>
                      <ListItemText primary="Change Password" />
                    </MenuItem>
                    <MenuItem
                      onClick={handleLogout}
                      sx={{
                        justifyContent: "flex-start",
                      }}
                    >
                      <ListItemIcon>
                        <FaSignOutAlt />
                      </ListItemIcon>
                      <ListItemText primary="Log Out" />
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      sx={{
                        justifyContent: "flex-start",
                      }}
                    >
                      <ListItemIcon>
                        <FaRegLightbulb />
                      </ListItemIcon>
                      Theme: {isDarkMode ? "Dark" : "Light"} <ThemeToggle />
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Container>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default HeaderTop;
