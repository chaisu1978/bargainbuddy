import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  Typography,
  Avatar,
  Snackbar,
  Alert,
} from "@mui/material";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import apiClient from "../../services/auth";
import NewShoppingList from "../common/NewShoppingList";

interface AddToShoppingListViewProps {
  listing: any;
  sanitizedListing: any;
  shoppingLists: any[];
  loadingLists: boolean;
  onBack: () => void;
  onNewListCreated: (newList: any) => void;
}

const AddToShoppingListView: React.FC<AddToShoppingListViewProps> = ({
  listing,
  sanitizedListing,
  shoppingLists,
  loadingLists,
  onNewListCreated,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Sort shopping lists by last updated
  const sortedShoppingLists = [...shoppingLists].sort(
    (a, b) =>
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
  );

  const initializedRef = useRef(false);

  // Automatically check the first shopping list if not already checked
  useEffect(() => {
    if (sortedShoppingLists.length > 0 && !initializedRef.current) {
      setChecked([sortedShoppingLists[0].name]); // Check the first list by default
      initializedRef.current = true; // Ensure this only runs once
    }
  }, [sortedShoppingLists, checked]);

  const handleToggle = (name: string) => {
    setChecked(
      (prevChecked) =>
        prevChecked.includes(name)
          ? prevChecked.filter((item) => item !== name) // Remove if already checked
          : [...prevChecked, name] // Add if not already checked
    );
  };

  const handleAddNewList = async (name: string) => {
    setIsCreating(true);

    try {
      const response = await apiClient.post("/shoppinglist/shoppinglist/", {
        name,
        description: `A Shopping List for ${name}`,
      });

      onNewListCreated(response.data);
    } catch (error) {
      console.error("Error creating shopping list:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleAddToShoppingLists = async () => {
    if (checked.length === 0) {
      setSnackbarMessage("Please select at least one shopping list.");
      setSnackbarOpen(true);
      return;
    }

    setIsCreating(true);

    try {
      const requests = checked.map((listName) => {
        const list = shoppingLists.find((list) => list.name === listName);

        const payload = {
          shopping_list: list.id,
          product: listing.product_id,
          store: listing.store_id,
          is_needed: true,
        };

        return apiClient.post("/shoppinglist/shoppinglistitem/", payload);
      });

      await Promise.all(requests);
      setIsSuccess(true);
      setChecked([]);
      setSnackbarMessage("Items successfully added to shopping lists.");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error adding to shopping lists:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: Record<string, unknown> };
        };
        const errorMessage = axiosError.response?.data
          ? Object.entries(axiosError.response.data)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n")
          : "Failed to add items to shopping lists. Please try again.";
        setSnackbarMessage(errorMessage);
      } else {
        setSnackbarMessage(
          "Failed to add items to shopping lists. Please try again."
        );
      }
      setSnackbarOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  const renderShoppingListSection = () => {
    if (loadingLists) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (isSuccess) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "200px",
            alignItems: "center",
            py: 4,
            textAlign: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FaCheckCircle
              style={{
                fontSize: "4rem",
                color: "green",
                marginBottom: "16px",
              }}
            />
          </motion.div>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Price listings added to shopping list(s)
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <Divider />
        {sortedShoppingLists.length > 0 && (
          <Button
            name="addtolist"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: 1,
              backgroundColor: "primary.main",
              color: "text.primary",
              fontWeight: "bold",
            }}
            onClick={handleAddToShoppingLists}
            disabled={isCreating}
          >
            {isCreating ? "Adding..." : "Add"}
          </Button>
        )}
        <Box
          sx={{
            maxHeight: "200px",
            overflowY: "auto",
            marginBottom: 1,
          }}
        >
          {/* Snackbar for Notifications */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity="info"
              variant="outlined"
              sx={{
                width: "100%",
                backgroundColor: "secondary.main",
                color: "text.primary",
              }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
          <List>
            {sortedShoppingLists.length === 0 ? (
              <Typography variant="body2" sx={{ mb: 2 }}>
                No shopping lists found. Create a new shopping list.
              </Typography>
            ) : (
              sortedShoppingLists.map((list) => {
                const labelId = `checkbox-list-label-${list.id}`;
                return (
                  <ListItem key={list.id} disablePadding>
                    <ListItemButton
                      role={undefined}
                      onClick={() => handleToggle(list.name)}
                      dense
                    >
                      <ListItemIcon sx={{ minWidth: "47px" }}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 32,
                            height: 32,
                            fontSize: "1rem",
                            color: "text.primary",
                          }}
                        >
                          {list.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>

                      <ListItemText id={labelId} primary={list.name} />
                      <Checkbox
                        edge="end"
                        checked={checked.includes(list.name)}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ "aria-labelledby": labelId }}
                        sx={{
                          color: "secondary.main",
                          "&.Mui-checked": {
                            color: "secondary.main",
                          },
                          "& .MuiSvgIcon-root": {
                            color: "text.secondary",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })
            )}
          </List>
        </Box>

        <Divider sx={{ mb: 2, mt: 2 }} />

        <NewShoppingList
          onAddNewList={handleAddNewList}
          isCreating={isCreating}
          buttonAlignment="center" // Example: align center
        />
      </>
    );
  };

  return (
    <Box sx={{ height: "80vh" }}>
      <Typography variant="h6" align="center" sx={{ mb: 1 }}>
        SELECT SHOPPING LIST
      </Typography>

      {renderShoppingListSection()}

      <Typography variant="h4" sx={{ fontWeight: "bold", mt: 2 }}>
        ${listing.price}
      </Typography>

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

      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          mb: 0,
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
    </Box>
  );
};

export default AddToShoppingListView;
