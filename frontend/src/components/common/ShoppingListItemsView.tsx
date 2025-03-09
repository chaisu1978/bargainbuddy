import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Switch,
} from "@mui/material";
import { FaTrash } from "react-icons/fa";

interface ShoppingListItem {
  id: number;
  product: number;
  store: number;
  is_needed?: boolean;
  priceDetails?: {
    product_name?: string;
    store_name?: string;
    product_brand?: string;
    product_amount?: string;
    product_image?: string;
    store_image?: string;
    price?: string;
  } | null;
}

interface ShoppingListItemsViewProps {
  items: ShoppingListItem[];
  loading: boolean;
  onPriceClick: (priceDetails: any) => void;
  onToggleNeeded: (item: ShoppingListItem) => void;
  onRemoveItem: (item: ShoppingListItem) => void;
  noItemsMessage?: string;
}

const ShoppingListItemsView: React.FC<ShoppingListItemsViewProps> = ({
  items,
  loading,
  onPriceClick,
  onToggleNeeded,
  onRemoveItem,
  noItemsMessage,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        minHeight: "90vh",
        pb: { xs: 25, md: 0, lg: 0 },
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <CircularProgress />
        </Box>
      ) : !items || items.length === 0 ? (
        <Typography sx={{ textAlign: "center", mt: 2 }}>
          {noItemsMessage || "No items found in this shopping list."}
        </Typography>
      ) : (
        <List>
          {items.map((item) => {
            const { priceDetails } = item;
            return (
              <ListItem
                key={item.id}
                sx={{
                  borderBottom: "1px solid #ddd",
                  padding: 1,
                  display: "flex",
                  alignItems: "flex-start",
                  backgroundColor: item.is_needed
                    ? "background.main"
                    : "inherit",
                  "&:hover": { backgroundColor: "background.paper" },
                  cursor: "pointer",
                }}
              >
                {/* Price Details Section */}
                <Box
                  component="span"
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                  onClick={() => onPriceClick(priceDetails)}
                >
                  {/* Image Section */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "start",
                      marginRight: 2,
                      marginLeft: 0,
                      width: 50,
                    }}
                  >
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "4px",
                        overflow: "hidden",
                        marginBottom: 0.5,
                        border: "1px solid #ddd",
                      }}
                    >
                      <img
                        src={
                          priceDetails?.product_image ||
                          "https://via.placeholder.com/50"
                        }
                        alt="Product"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid #ddd",
                      }}
                    >
                      <img
                        src={
                          priceDetails?.store_image ||
                          "https://via.placeholder.com/50"
                        }
                        alt="Store"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  </Box>
                  {/* Text Section */}
                  <ListItemText
                    primary={
                      priceDetails
                        ? `${priceDetails.product_brand} ${priceDetails.product_name} - ${priceDetails.product_amount}`
                        : "Unknown Item"
                    }
                    secondary={
                      priceDetails ? (
                        <>
                          {priceDetails.store_name} <br />${priceDetails.price}
                        </>
                      ) : (
                        "None"
                      )
                    }
                    primaryTypographyProps={{
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      fontWeight: "600",
                    }}
                    sx={{
                      textDecoration: item.is_needed ? "none" : "line-through",
                      textDecorationThickness: "2px",
                    }}
                  />
                </Box>
                {/* Action Section */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    marginLeft: "auto",
                  }}
                >
                  {/* Toggle Switch */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      backgroundColor: item.is_needed
                        ? "primary.main"
                        : "background.paper",
                      padding: 0.5,
                      borderRadius: "4px",
                    }}
                  >
                    <Switch
                      size="small"
                      color="default"
                      checked={item.is_needed}
                      onChange={() => onToggleNeeded(item)}
                    />
                  </Box>
                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item);
                    }}
                    sx={{ fontSize: "1rem" }}
                  >
                    <FaTrash />
                  </IconButton>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default ShoppingListItemsView;
