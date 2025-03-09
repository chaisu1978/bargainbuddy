import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../services/auth";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Container,
  IconButton,
  Collapse,
} from "@mui/material";
import PriceDetailsModal from "../common/PriceDetailsModal";
import NewShoppingList from "../common/NewShoppingList";
import {
  EditShoppingListModal,
  ConfirmDeleteModal,
} from "../common/ShoppingListModals";
import ShoppingListView from "../common/ShoppingListView";
import ShoppingListItemsView from "../common/ShoppingListItemsView";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

// Define types for shopping lists and price listings
interface ShoppingList {
  id: number;
  name: string;
  description: string;
  last_updated: string;
}

interface PriceListing {
  id: number;
  name: string;
  price: string;
}

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

// Define the response type for paginated data
interface PaginatedResponse<T> {
  results: T[];
  next: string | null;
}

// Define a type for the API response
interface ApiResponse<T> {
  data: PaginatedResponse<T>;
}

// Generic function to fetch all paginated data
const fetchAllPages = async <T,>(endpoint: string): Promise<T[]> => {
  let data: T[] = [];
  let nextUrl: string | null = endpoint;

  while (nextUrl) {
    try {
      const response: ApiResponse<T> = await apiClient.get<
        PaginatedResponse<T>
      >(nextUrl);
      data = [...data, ...response.data.results];
      nextUrl = response.data.next;
    } catch (error) {
      console.error(`Error fetching data from ${nextUrl}:`, error);
      break;
    }
  }

  return data;
};

const ShoppingLists = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [shoppingListItems, setShoppingListItems] = useState<
    ShoppingListItem[]
  >([]);
  const [loadingItems, setLoadingItems] = useState(true); // Loading state for items
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(
    shoppingLists[0]
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<ShoppingList | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<ShoppingList | null>(null);
  const [collapseLists, setCollapseLists] = useState(false);

  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ShoppingListItem | null>(
    null
  );
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = shoppingListItems.length;
  const neededItems = shoppingListItems.filter((item) => item.is_needed).length;
  const totalPrice = shoppingListItems
    .filter((item) => item.is_needed && item.priceDetails?.price)
    .reduce((sum, item) => sum + parseFloat(item.priceDetails!.price || "0"), 0)
    .toFixed(2);

  useEffect(() => {
    const fetchShoppingLists = async () => {
      setLoadingLists(true);

      try {
        // Explicitly specify ShoppingList type when calling fetchAllPages
        const lists = await fetchAllPages<ShoppingList>(
          "/shoppinglist/shoppinglist/"
        );
        const sortedLists = lists.sort(
          (a, b) =>
            new Date(b.last_updated).getTime() -
            new Date(a.last_updated).getTime()
        );

        setShoppingLists(sortedLists);
        if (sortedLists.length > 0) {
          setSelectedList(sortedLists[0]);
        }
      } catch (error) {
        console.error("Error fetching shopping lists:", error);
      } finally {
        setLoadingLists(false);
      }
    };

    fetchShoppingLists();
  }, []);

  useEffect(() => {
    if (!selectedList) {
      console.log("No selected list, stopping spinner");
      setLoadingItems(false); // Explicitly stop spinner
      return;
    }

    const fetchShoppingListItems = async () => {
      setShoppingListItems([]); // Clear previous items
      setLoadingItems(true);

      try {
        // Fetch all items across pages using the fetchAllPages helper
        const items = await fetchAllPages<ShoppingListItem>(
          `/shoppinglist/shoppinglistitem/?shopping_list=${selectedList.id}`
        );

        // Fetch and sanitize price details for each item
        const updatedItems = await Promise.all(
          items.map(async (item: ShoppingListItem) => {
            try {
              const priceResponse = await apiClient.get(
                `/price/price/?product=${item.product}&store=${item.store}`
              );
              const priceDetails = priceResponse.data.results[0] || {};

              // Sanitize priceDetails values
              const sanitizedPriceDetails = {
                ...priceDetails,
                product_brand:
                  priceDetails.product_brand === "nan" ||
                  !priceDetails.product_brand
                    ? ""
                    : priceDetails.product_brand,
                product_amount:
                  priceDetails.product_amount === "nan" ||
                  !priceDetails.product_amount
                    ? "None"
                    : priceDetails.product_amount,
              };

              return { ...item, priceDetails: sanitizedPriceDetails };
            } catch (error) {
              console.error("Error fetching price details:", error);
              return { ...item, priceDetails: null };
            }
          })
        );

        setShoppingListItems(updatedItems); // Update the items for the selected list
      } catch (error) {
        console.error("Error fetching shopping list items:", error);
      } finally {
        setLoadingItems(false);
        scrollMainContentToTop();
      }
    };

    fetchShoppingListItems();
  }, [selectedList]);

  const handleCollapseLists = () => setCollapseLists(!collapseLists);

  // State for selected shopping list and modal

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PriceListing | null>(null);

  // Handlers for list and price selection
  const handleListClick = (list: ShoppingList) => {
    setSelectedList(list);
  };

  const handlePriceClick = (priceDetails: any) => {
    handleOpenModal(priceDetails);
  };

  const handleAddNewList = async (name: string) => {
    setLoadingLists(true);

    try {
      const response = await apiClient.post("/shoppinglist/shoppinglist/", {
        name,
        description: `A Shopping List for ${name}`,
      });
      setShoppingLists((prevLists) => [response.data, ...prevLists]); // Add new list at the top
    } catch (error) {
      console.error("Error creating shopping list:", error);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleDeleteList = (list: ShoppingList) => {
    setListToDelete(list);
    setDeleteDialogOpen(true);
  };

  const handleEditList = (list: ShoppingList) => {
    setListToEdit(list);
    setEditDialogOpen(true);
  };

  const confirmDeleteList = async () => {
    if (!listToDelete) return;

    try {
      await apiClient.delete(`/shoppinglist/shoppinglist/${listToDelete.id}/`);
      setShoppingLists((prevLists) =>
        prevLists.filter((list) => list.id !== listToDelete.id)
      );

      if (selectedList?.id === listToDelete.id) {
        // If the deleted list was selected, clear the selected list and items
        if (shoppingLists.length === 1) {
          setSelectedList(null); // No lists left
          setShoppingListItems([]); // Clear items
          setLoadingItems(false); // Ensure spinner stops
        } else {
          setSelectedList(shoppingLists[0]); // Select the first list
        }
      }

      setDeleteDialogOpen(false);
      setListToDelete(null);
    } catch (error) {
      console.error("Error deleting shopping list:", error);
    }
  };

  const handleUpdateList = async () => {
    if (!listToEdit) return;

    try {
      const response = await apiClient.put(
        `/shoppinglist/shoppinglist/${listToEdit.id}/`,
        {
          name: listToEdit.name,
          description: listToEdit.description,
        }
      );

      setShoppingLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listToEdit.id ? response.data : list
        )
      );
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating shopping list:", error);
    }
  };

  const handleRemoveItem = async () => {
    if (!itemToDelete) return;

    try {
      await apiClient.delete(
        `/shoppinglist/shoppinglistitem/${itemToDelete.id}/`
      );
      setShoppingListItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemToDelete.id)
      );
      setDeleteItemDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting shopping list item:", error);
    }
  };

  const handleToggleNeeded = async (item: ShoppingListItem) => {
    // Save the current state for potential rollback
    const originalIsNeeded = item.is_needed;

    // Optimistically update the item in the UI
    const updatedItem = { ...item, is_needed: !item.is_needed };
    setShoppingListItems((prevItems) =>
      prevItems.map((currentItem) =>
        currentItem.id === item.id ? updatedItem : currentItem
      )
    );

    try {
      // Send the update to the API
      await apiClient.patch(`/shoppinglist/shoppinglistitem/${item.id}/`, {
        is_needed: updatedItem.is_needed,
      });
    } catch (error) {
      console.error("Error updating item:", error);

      // Rollback to the original state if the API call fails
      setShoppingListItems((prevItems) =>
        prevItems.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, is_needed: originalIsNeeded }
            : currentItem
        )
      );
    }
  };

  const handleOpenModal = (priceDetails: any) => {
    setSelectedPrice(priceDetails);
    setModalOpen(true);
    navigate(location.pathname, { state: { modalOpen: true } }); // Push to history
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPrice(null);
    navigate(location.pathname, { state: { modalOpen: false } }); // Remove from history
  };
  useEffect(() => {
    if (location.state?.modalOpen) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [location.state]);

  const scrollMainContentToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          height: "calc(100vh - 121px)",
          overflow: "hidden",
          gap: 1,
        }}
      >
        {/* Shopping Lists Section */}
        <Paper
          sx={{
            width: { xs: "100%", sm: "40%" },
            maxHeight: { xs: "41vh", sm: "82vh" },
            flexGrow: 1, // Allows the Paper to expand in the parent container
            display: "flex",
            flexDirection: "column",
            border: { xs: "3px solid", sm: 0 },
            borderColor: { xs: "primary.main" },
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 1.5,
              paddingBottom: 0,
            }}
          >
            <Typography variant="h5" gutterBottom>
              {shoppingLists.length} Shopping Lists
            </Typography>
          </Box>
          <Collapse in={!collapseLists} unmountOnExit>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1, // Fills the remaining space inside Paper
                overflow: "hidden", // Prevents overflow issues
              }}
            >
              <NewShoppingList
                onAddNewList={handleAddNewList}
                isCreating={loadingLists}
                buttonAlignment="flex-start"
              />

              {/* Scrollable List Section */}
              <Box
                sx={{
                  flexGrow: 1, // Allows the scrollable section to expand
                  overflowY: "auto", // Enables vertical scrolling
                  maxHeight: { xs: "27vh", sm: "59vh" }, // Allows the Box to grow vertically
                }}
              >
                <ShoppingListView
                  shoppingLists={shoppingLists}
                  loadingLists={loadingLists}
                  selectedList={selectedList}
                  onSelectList={handleListClick}
                  onEditList={handleEditList}
                  onDeleteList={handleDeleteList}
                />
              </Box>
            </Box>
          </Collapse>
        </Paper>
        <IconButton
          onClick={handleCollapseLists}
          sx={{
            backgroundColor: "primary.main",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
            display: { xs: "inherit", sm: "none" },
            borderRadius: "4px",
            width: "64px",
            height: "30px",
            alignSelf: "center",
            position: "relative",
            top: "-4px",
            transform: "translateY(-50%)",
          }}
        >
          {collapseLists ? <FaChevronDown /> : <FaChevronUp />}
        </IconButton>
        {/* Price Listings Section */}
        <Box
          sx={{
            padding: 1,
            paddingBottom: 0.5,
            paddingTop: 0,
            marginTop: { xs: -3, sm: 2 },
            display: "flex",
            flexDirection: "column",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Typography variant="h6" sx={{ pr: 3 }}>
            {selectedList ? `${selectedList.name}` : "Select a Shopping List"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignSelf: "flex-end",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <Typography variant="body1" sx={{ fontSize: "1em" }}>
              ({neededItems}/{totalItems})
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: "1.2em", fontWeight: "600" }}
            >
              ${totalPrice}
            </Typography>
          </Box>

          <Divider />
          <ShoppingListItemsView
            items={shoppingListItems}
            loading={loadingItems}
            onPriceClick={handlePriceClick}
            onToggleNeeded={handleToggleNeeded}
            onRemoveItem={(item) => {
              setItemToDelete(item);
              setDeleteItemDialogOpen(true);
            }}
            noItemsMessage="No shopping list items yet."
          />
        </Box>

        {/* Price Details Modal */}
        {selectedPrice && (
          <PriceDetailsModal
            open={modalOpen}
            onClose={handleCloseModal}
            listing={selectedPrice}
            showAddToShoppingListButton={false}
          />
        )}
      </Box>
      <EditShoppingListModal
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        listToEdit={listToEdit}
        onSave={handleUpdateList}
        onChange={(field, value) =>
          setListToEdit((prev) => ({ ...prev!, [field]: value }))
        }
      />

      <ConfirmDeleteModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteList}
        title="Delete Shopping List"
        description={`Are you sure you want to delete the shopping list "${listToDelete?.name}"? This action cannot be undone.`}
      />

      <ConfirmDeleteModal
        open={deleteItemDialogOpen}
        onClose={() => setDeleteItemDialogOpen(false)}
        onConfirm={handleRemoveItem}
        title="Remove Item"
        description="Are you sure you want to remove this item from the shopping list?"
      />
    </Container>
  );
};

export default ShoppingLists;
