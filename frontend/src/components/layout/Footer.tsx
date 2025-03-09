import { Box, Container, IconButton } from "@mui/material";
import { FaHome, FaList } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar, // Ensure it stays above the main content
        backgroundColor: "#495123",
        color: "primary.main",
      }}
    >
      <Container maxWidth="lg" sx={{ minHeight: "65px" }}>
        <Box
          sx={{
            backgroundColor: "#495123",
            color: "primary.main",
            display: "flex",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <IconButton
            aria-label="Home"
            component={Link}
            to="/"
            sx={{ color: "primary.main", fontSize: "2rem", padding: 2 }}
          >
            <FaHome />
          </IconButton>

          <IconButton
            aria-label="Shopping List"
            component={Link}
            to="/shopping-lists"
            sx={{ color: "primary.main", fontSize: "2rem", padding: 2 }}
          >
            <FaList />
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
