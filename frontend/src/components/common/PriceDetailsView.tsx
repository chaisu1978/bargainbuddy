import React from "react";
import { Box, Typography, Divider, Button } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { LatLngExpression } from "leaflet";
import { useSelector } from "react-redux";
import { RootState } from "../../store"; // Adjust the path if your `store` file is elsewhere

interface PriceDetailsViewProps {
  listing: any;
  sanitizedListing: any;
  storeLocation: LatLngExpression;
  priceHistory: { date_added: string; price: number }[];
  onAddToShoppingList?: () => void; // Add this prop
}

const PriceDetailsView: React.FC<PriceDetailsViewProps> = ({
  listing,
  sanitizedListing,
  storeLocation,
  priceHistory,
  onAddToShoppingList,
}) => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ marginBottom: 2, flex: 1 }}>
          {sanitizedListing.product_brand} {sanitizedListing.product_name}
          {" - "}
          {sanitizedListing.product_amount || ""}
        </Typography>
      </Box>
      <Divider />
      {/* If logged in show Add to Shopping List Btn */}
      {isAuthenticated && onAddToShoppingList && (
        <>
          <Box sx={{ marginTop: 2 }}>
            <Button
              name="addshoplist"
              variant="contained"
              color="primary"
              fullWidth
              onClick={onAddToShoppingList} // Use the handler here
            >
              + Add to Shopping List
            </Button>
          </Box>
        </>
      )}

      {/* If not logged in 'Sign in or Sign up' Buttons */}

      {!isAuthenticated && (
        <>
          <Box
            sx={{
              marginTop: 2,
              backgroundColor: "secondary.main",
              padding: 1,
            }}
          >
            <Typography variant="body1">
              <i>
                <Button
                  size="small"
                  href="/login"
                  name="loginBtn"
                  variant="contained"
                  color="primary"
                >
                  Sign in
                </Button>{" "}
                to save to a shopping list.
              </i>
            </Typography>
          </Box>
        </>
      )}

      {/* Product Info */}
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "1.1rem",
              fontWeight: "bold",
            }}
          >
            Product:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
            }}
          >
            {sanitizedListing.product_name || "None"}
          </Typography>
          <Typography variant="body2">
            Brand: {sanitizedListing.product_brand || "None"}
          </Typography>
          <Typography variant="body2">
            Amount: {sanitizedListing.product_amount}
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            width: "150px",
            height: "100px",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          <img
            src={sanitizedListing.product_image}
            alt={`${sanitizedListing.product_name}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      </Box>

      {/* Store Info */}
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontSize: "1.1rem",
              fontWeight: "bold",
            }}
          >
            Store:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
            }}
          >
            {sanitizedListing.store_name || "Not specified"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
            }}
          >
            {sanitizedListing.store_address || "Not specified"}
          </Typography>
          <Typography variant="body2">
            Region: {sanitizedListing.store_region || "Not specified"}
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            width: "150px",
            height: "100px",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          <img
            src={sanitizedListing.store_image}
            alt={`${sanitizedListing.store_name}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      </Box>

      {/* Map */}
      <Box
        sx={{
          marginTop: 2,
          height: "175px",
          width: "100%",
          border: "1px solid #e0e0e0",
        }}
      >
        <MapContainer
          center={storeLocation}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Marker position={storeLocation}>
            <Popup>
              <b>{listing.store_name}</b>
              <br />
              {listing.store_address || "No address provided"}
            </Popup>
          </Marker>
        </MapContainer>
      </Box>
      <Divider />

      {/* Price History Chart */}
      <Box sx={{ marginTop: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          ${listing.price}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Price History:
        </Typography>
        {priceHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={priceHistory}>
              <CartesianGrid stroke="#2c2518" strokeDasharray="3 3" />
              <XAxis
                dataKey="date_added"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                }
              />
              <YAxis tickFormatter={(price) => `$${price.toFixed(2)}`} />
              <Tooltip
                formatter={(value, _name) => {
                  const formattedValue =
                    typeof value === "number"
                      ? `$${value.toFixed(2)}`
                      : `$0.00`;
                  return [formattedValue];
                }}
                labelFormatter={(label) => {
                  const parsedDate = new Date(label);
                  if (isNaN(parsedDate.getTime())) return label;
                  return parsedDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#357791"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Typography>No price history available.</Typography>
        )}
      </Box>
    </>
  );
};

export default PriceDetailsView;
