import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import apiClient from "../../services/auth";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess } from "../../store/authSlice";
import { RootState, AppDispatch } from "../../store";
import horizontalLightLogo from "../../assets/logos/horizontal-light.svg";
import horizontalColorLogo from "../../assets/logos/horizontal-color.svg";

const SignUpPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      // Register the user
      await apiClient.post("/core/register/", {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
        confirm_password: form.confirmPassword,
      });

      // Log the user in immediately
      const { data: loginData } = await apiClient.post("/core/login/", {
        email: form.email,
        password: form.password,
      });

      // Save tokens in localStorage
      localStorage.setItem("accessToken", loginData.access);
      localStorage.setItem("refreshToken", loginData.refresh);

      // Fetch user details and update the Redux store
      const { data: userDetails } = await apiClient.get("/core/me/");
      dispatch(loginSuccess(userDetails)); // Pass only the data part to Redux

      // Navigate to the homepage
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const logoSrc = isDarkMode ? horizontalLightLogo : horizontalColorLogo;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "background.paper",
      }}
    >
      <Box textAlign={"center"}>
        <Link href="/">
          <img
            src={logoSrc}
            alt="Logo"
            style={{ width: "50%", marginTop: "1rem" }}
          />
        </Link>
        <Container
          maxWidth="xs"
          sx={{
            marginTop: 3,
            padding: 4,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            backgroundColor: "background.default",
          }}
        >
          <Typography
            variant="h5"
            align="center"
            sx={{ marginBottom: 2, fontWeight: "bold" }}
          >
            Sign Up
          </Typography>
          <Typography
            align="center"
            sx={{ marginBottom: 3, color: "text.secondary" }}
          >
            Create an account to access the platform.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              label="First Name"
              name="firstName"
              fullWidth
              variant="filled"
              required
              value={form.firstName}
              onChange={handleChange}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              label="Last Name"
              name="lastName"
              fullWidth
              variant="filled"
              required
              value={form.lastName}
              onChange={handleChange}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              label="Email"
              name="email"
              fullWidth
              variant="filled"
              required
              type="email"
              value={form.email}
              onChange={handleChange}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              label="Password"
              name="password"
              fullWidth
              variant="filled"
              required
              type="password"
              value={form.password}
              onChange={handleChange}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              fullWidth
              variant="filled"
              required
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              sx={{ marginBottom: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Sign Up"}
            </Button>
          </form>
          <Box sx={{ marginTop: 2 }}>
            <Link href="/login" underline="hover">
              Already have an account? Sign In
            </Link>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default SignUpPage;
