import React, { useEffect, useState, useMemo } from "react";
import { Modal, Box, IconButton, CircularProgress } from "@mui/material";
import { FaTimes, FaChevronLeft } from "react-icons/fa";
import { LatLngExpression } from "leaflet";
import apiClient from "../../services/auth";
import PriceDetailsView from "./PriceDetailsView";
import AddToShoppingListView from "./AddToShoppingListView";

interface PriceDetailsModalProps {
  open: boolean;
  onClose: () => void;
  listing: any;
  showAddToShoppingListButton?: boolean;
}

const PriceDetailsModal: React.FC<PriceDetailsModalProps> = ({
  open,
  onClose,
  listing,
  showAddToShoppingListButton = true, // Default to true
}) => {
  const [priceHistory, setPriceHistory] = useState<
    { date_added: string; price: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [modalView, setModalView] = useState<
    "PriceDetails" | "AddToShoppingList"
  >("PriceDetails");
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Fetch price history when modal opens
  useEffect(() => {
    if (listing?.id && open && modalView === "PriceDetails") {
      setLoading(true);
      apiClient
        .get(`/price/price-history/${listing.id}/`)
        .then((response) => {
          setPriceHistory(
            response.data.map((entry: any) => ({
              date_added: entry.date_added,
              price: parseFloat(entry.price),
            }))
          );
        })
        .catch((error) => console.error("Error fetching price history:", error))
        .finally(() => setLoading(false));
    }
  }, [listing?.id, open, modalView]);

  // Fetch shopping lists when switching to "AddToShoppingList"
  const fetchShoppingLists = async () => {
    setLoadingLists(true);
    try {
      const { data } = await apiClient.get("/shoppinglist/shoppinglist/");
      setShoppingLists(data.results || []);
    } catch (error) {
      console.error("Error fetching shopping lists:", error);
      setShoppingLists([]);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAddToShoppingList = () => {
    setModalView("AddToShoppingList");
    fetchShoppingLists();
  };

  const handleBackToPriceDetails = () => {
    setModalView("PriceDetails");
  };

  const handleClose = () => {
    setModalView("PriceDetails");
    onClose();
  };

  // Sanitize the data for the modal
  const sanitizedListing = useMemo(() => {
    if (!listing) return null;
    return {
      ...listing,
      product_brand:
        listing.product_brand === "nan" ? "" : listing.product_brand,
      product_amount:
        listing.product_amount === "nan" ? "" : listing.product_amount,
      store_address:
        listing.store_address === "nan" ? "" : listing.store_address,
      store_region: listing.store_region === "nan" ? "" : listing.store_region,
    };
  }, [listing]);

  // Default location if no store location is available
  const defaultLocation: LatLngExpression = [10.656, -61.518];
  const storeLocation: LatLngExpression = [
    listing?.store_lat || defaultLocation[0],
    listing?.store_lon || defaultLocation[1],
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
    >
      <Box
        sx={{
          backgroundColor: "background.paper",
          padding: 3,
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90vh", // Limit the height for scrolling
          overflowY: "auto", // Enable vertical scrolling
          borderRadius: "4px",
          position: "relative",
        }}
      >
        {/* Back Button (conditionally rendered) */}
        {modalView === "AddToShoppingList" && (
          <IconButton
            onClick={handleBackToPriceDetails}
            sx={{
              backgroundColor: "secondary.main",
              border: "1px solid",
              borderColor: "primary.main",
              position: "absolute",
              top: 8,
              left: 8,
              "&:hover": {
                backgroundColor: "secondary.dark",
              },
            }}
          >
            <FaChevronLeft />{" "}
          </IconButton>
        )}

        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{
            backgroundColor: "secondary.main",
            border: "1px solid",
            borderColor: "primary.main",
            position: "absolute",
            top: 8,
            right: 8,
            "&:hover": {
              backgroundColor: "secondary.dark",
            },
          }}
        >
          <FaTimes />
        </IconButton>

        {/* Modal Content */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "90vh", // Adjust spinner height
            }}
          >
            <CircularProgress />
          </Box>
        ) : modalView === "PriceDetails" ? (
          sanitizedListing && (
            <PriceDetailsView
              listing={listing}
              sanitizedListing={sanitizedListing}
              storeLocation={storeLocation}
              priceHistory={priceHistory}
              onAddToShoppingList={
                showAddToShoppingListButton
                  ? handleAddToShoppingList
                  : undefined
              }
            />
          )
        ) : (
          <AddToShoppingListView
            listing={listing}
            sanitizedListing={sanitizedListing}
            shoppingLists={shoppingLists}
            loadingLists={loadingLists}
            onBack={handleBackToPriceDetails}
            onNewListCreated={(newList) => {
              setShoppingLists((prevLists) => [...prevLists, newList]);
            }}
          />
        )}
      </Box>
    </Modal>
  );
};

export default PriceDetailsModal;
