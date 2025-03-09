import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  CardActionArea,
} from "@mui/material";

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

interface PriceCardProps {
  listing: any; // Replace `any` with your appropriate `PriceListing` type
  onClick: () => void; // Function to handle click events
}

const PriceCard = ({ listing, onClick }: PriceCardProps) => {
  const sanitizedListing = {
    ...listing,
    product_brand: listing.product_brand === "nan" ? "" : listing.product_brand,
    product_amount:
      listing.product_amount === "nan" ? "" : listing.product_amount,
    store_address: listing.store_address === "nan" ? "" : listing.store_address,
  };

  return (
    <Card
      component={motion.div}
      whileHover={{
        scale: 1.08,
        boxShadow: "0px 5px 15px rgba(0,0,0,0.3)",
      }}
      whileTap={{ scale: 0.95 }}
      sx={{
        width: "100%",
        margin: 0,
        borderRadius: "4px",
        boxShadow: 3,
        overflow: "hidden",
        backgroundColor: "secondary.main",
        border: "3px solid",
        borderColor: "primary.main",
      }}
    >
      <CardActionArea onClick={onClick}>
        <Box sx={{ display: "flex", justifyContent: "center", padding: 1 }}>
          <CardMedia
            component="img"
            image={sanitizedListing.product_image}
            alt={`${sanitizedListing.product_name}`}
            sx={{
              borderRadius: "4px",
              width: "50%",
              height: "80px",
              objectFit: "cover",
              margin: "0 auto",
              border: "2px solid",
              borderColor: "primary.main",
            }}
          />
          <CardMedia
            component="img"
            image={sanitizedListing.store_image}
            alt={`${sanitizedListing.store_name}`}
            sx={{
              borderRadius: "4px",
              width: "50%",
              height: "80px",
              objectFit: "cover",
              margin: "0 auto",
              border: "2px solid",
              borderColor: "primary.main",
            }}
          />
        </Box>
        <CardContent
          sx={{
            padding: "8px",
            paddingBottom: "8px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                verticalAlign: "top",
              }}
            >
              <Typography
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                  fontSize: {
                    xs: "0.8rem",
                    sm: "1rem",
                  },
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  textOverflow: "ellipsis",
                  minHeight: "2lh",
                }}
              >
                {sanitizedListing.product_brand}{" "}
                {sanitizedListing.product_name || "Unknown Product"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                  fontSize: {
                    xs: "0.8rem",
                    sm: "1rem",
                  },
                }}
              >
                {sanitizedListing.product_amount || "None"}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontWeight: "bold",
                color: "text.brandc",
                fontSize: {
                  xs: "0.8rem",
                  sm: "1rem",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  textOverflow: "ellipsis",
                  minHeight: "2lh",
                },
              }}
            >
              {sanitizedListing.store_name}
            </Typography>
            {sanitizedListing.store_address && (
              <Typography
                gutterBottom
                sx={{
                  fontWeight: "normal",
                  color: "text.brandc",
                  fontSize: {
                    xs: "0.6rem",
                    sm: "0.8rem",
                  },
                }}
              >
                {sanitizedListing.store_address}
              </Typography>
            )}
          </Box>
        </CardContent>
        <Typography
          variant="h5"
          paddingTop={1}
          color="inherit"
          align="center"
          sx={{
            backgroundColor: "primary.main",
            fontWeight: "bold",
            fontSize: {
              xs: "1.3rem",
              sm: "1.5rem",
            },
          }}
        >
          ${sanitizedListing.price}
        </Typography>
        <Typography
          color="inherit"
          align="center"
          sx={{
            backgroundColor: "primary.main",
            fontSize: {
              xs: "0.7rem",
              sm: "0.8rem",
            },
          }}
        >
          {formatDate(sanitizedListing.date_added)}
        </Typography>
      </CardActionArea>
    </Card>
  );
};

export default PriceCard;
