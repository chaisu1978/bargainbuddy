import { useEffect, useState } from "react";
import {
  DataGrid,
  GridPaginationModel,
  GridRowSelectionModel,
  GridColDef,
} from "@mui/x-data-grid";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Pagination,
  Drawer,
  Button,
  TextField,
  Tooltip,
  useMediaQuery,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { FaSearch } from "react-icons/fa";
import {
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  LocalOffer as LocalOffer,
} from "@mui/icons-material";
import apiClient from "../../services/auth";
import ConfirmDialog from "./ConfirmDialog";
import CustomSnackbar from "./CustomSnackbar";
import { GridRenderCellParams } from "@mui/x-data-grid";

// ---------------------------------
// 1) TypeScript Interface
// ---------------------------------
interface PriceListing {
  id: number;
  product_brand: string;
  product_name: string;
  product_amount: string;
  store_name: string;
  store_address: string;
  date_added: string; // from the serializer
  price: number; // numeric
  price_is_verified: string; // "pending" | "verified" | "rejected"
}

type BulkAction = "approvePrice" | "rejectPrice" | "delete";

// Helper to format date quickly (you can do something more robust if you like)
function formatDate(isoString: string) {
  if (!isoString) return "";
  const d = new Date(isoString);
  // e.g. "2024-01-02 14:05"
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------
// 2) Main Component
// ---------------------------------
export default function PriceListingManagement() {
  // State for the table data
  const [priceListings, setPriceListings] = useState<PriceListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination (DataGrid uses zero-based)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Row selection for bulk actions
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"readOnly" | "edit">("readOnly");
  const [selectedItem, setSelectedItem] = useState<PriceListing | null>(null);
  const [formData, setFormData] = useState<Partial<PriceListing>>({});

  // Snackbar & Confirm
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "info" | "error" | "success" | "warning",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Media query to detect small screens
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // ---------------------------------
  // 3) Fetch Table Data
  // ---------------------------------
  function fetchPriceListings(pageNum = 1, size = 50, search = "") {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    apiClient
      .get(
        `/webmin/price-listing/?page=${pageNum}&page_size=${size}${searchParam}`
      )
      .then((resp) => {
        const results: PriceListing[] = resp.data.results || [];
        setPriceListings(results);
        setTotalCount(resp.data.count || 0);

        // If results are empty and we're beyond page 1, reset
        if (results.length === 0 && pageNum > 1) {
          setPage(0);
        }
      })
      .catch((err) => {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Error fetching price listings",
          severity: "error",
        });
      });
  }

  useEffect(() => {
    fetchPriceListings(page + 1, pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm]);

  // ---------------------------------
  // 4) Build Columns
  // ---------------------------------
  const columns: GridColDef[] = [
    // (A) "Listing" column
    {
      field: "listing",
      headerName: "Listing",
      flex: 2,
      minWidth: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams<PriceListing, any>) => {
        const row = params.row as PriceListing;
        return (
          <Box>
            {/* Brand + Name + Amount */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {row.product_brand} {row.product_name}{" "}
              {row.product_amount ? `- ${row.product_amount}` : ""}
            </Typography>

            {/* Store name + address */}
            <Typography variant="body2">
              {row.store_name}
              {row.store_address ? `, ${row.store_address}` : ""}
            </Typography>

            {/* Date added */}
            <Typography variant="body2" sx={{ fontSize: ".7rem" }}>
              {row.date_added ? formatDate(row.date_added) : "N/A"}
            </Typography>
          </Box>
        );
      },
    },
    // (B) "Price" column
    {
      field: "price",
      headerName: "Price",
      width: 100,
      renderCell: (params: GridRenderCellParams<PriceListing, any>) => {
        const val = Number(params.value); // Ensure it's a number
        return (
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {isNaN(val) ? "N/A" : `TT$${val.toFixed(2)}`}
          </Typography>
        );
      },
    },

    // (C) "Verified" column (hide on small screens)
    !isSmall
      ? {
          field: "price_is_verified",
          headerName: "Verified",
          width: 120,
          renderCell: (params: GridRenderCellParams<PriceListing, any>) => {
            const val = params.value as string;
            return <Typography variant="body2">{val}</Typography>;
          },
        }
      : ({} as GridColDef),
  ].filter((col) => Object.keys(col).length > 0); // filter out empty if isSmall

  // ---------------------------------
  // 5) Bulk Actions
  // ---------------------------------
  async function handleBulkAction(action: BulkAction) {
    if (action === "delete") {
      setConfirmDialog({
        open: true,
        title: "Delete Price Listings",
        message: `Are you sure you want to delete ${rowSelectionModel.length} item(s)?`,
        onConfirm: () => performBulkAction(action),
      });
    } else {
      await performBulkAction(action);
    }
  }

  async function performBulkAction(action: BulkAction) {
    try {
      for (const id of rowSelectionModel) {
        if (action === "delete") {
          await apiClient.delete(`/webmin/price-listing/${id}/`);
        } else if (action === "approvePrice") {
          await apiClient.patch(`/webmin/price-listing/${id}/`, {
            price_is_verified: "verified",
          });
        } else if (action === "rejectPrice") {
          await apiClient.patch(`/webmin/price-listing/${id}/`, {
            price_is_verified: "rejected",
          });
        }
      }
      setSnackbar({
        open: true,
        message: "Bulk action completed.",
        severity: "success",
      });
      setRowSelectionModel([]);
      fetchPriceListings(page + 1, pageSize, searchTerm);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to complete bulk action.",
        severity: "error",
      });
    } finally {
      setConfirmDialog({
        ...confirmDialog,
        open: false,
      });
    }
  }

  // ---------------------------------
  // 6) Single-row selection + Drawer
  // ---------------------------------
  const handleRowClick = (params: any) => {
    const rowData = params.row as PriceListing;
    setSelectedItem(rowData);
    setFormData(rowData);
    setDrawerMode("readOnly");
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
  };

  // ---------------------------------
  // 7) Single item update
  // ---------------------------------
  async function handleSave() {
    if (!selectedItem) return;
    try {
      await apiClient.patch(`/webmin/price-listing/${selectedItem.id}/`, {
        price_is_verified: formData.price_is_verified,
      });
      setSnackbar({
        open: true,
        message: "Price listing updated.",
        severity: "success",
      });
      setDrawerOpen(false);
      fetchPriceListings(page + 1, pageSize, searchTerm);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to update price listing",
        severity: "error",
      });
    }
  }

  // ---------------------------------
  // 8) Single item delete
  // ---------------------------------
  const handleDelete = () => {
    if (!selectedItem) return;
    setConfirmDialog({
      open: true,
      title: "Delete Price Listing",
      message: `Are you sure you want to delete this item?`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/webmin/price-listing/${selectedItem.id}/`);
          setSnackbar({
            open: true,
            message: "Deleted successfully",
            severity: "info",
          });
          setDrawerOpen(false);
          fetchPriceListings(page + 1, pageSize, searchTerm);
        } catch (err) {
          console.error(err);
          setSnackbar({
            open: true,
            message: "Delete failed",
            severity: "error",
          });
        }
      },
    });
  };

  // ---------------------------------
  // 9) Render
  // ---------------------------------
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Sticky header: Title, Search, Bulk Buttons */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          backgroundColor: "background.default",
          pb: 1,
          pt: 1,
        }}
      >
        {/* Title */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LocalOffer />
          <Typography variant="h6">Price Listings</Typography>
        </Box>

        {/* Search + Bulk */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
        >
          {/* Search box */}
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search product or store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(0);
                }
              }}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
            <IconButton size="small" onClick={() => setPage(0)}>
              <FaSearch />
            </IconButton>
          </Box>

          {/* Bulk actions if any rows selected */}
          {rowSelectionModel.length > 0 && (
            <Stack direction="row" spacing={1} mt={{ xs: 1, sm: 0 }}>
              <Tooltip title="Approve Price" arrow>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleBulkAction("approvePrice")}
                >
                  <ThumbUpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject Price" arrow>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleBulkAction("rejectPrice")}
                >
                  <ThumbDownIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete" arrow>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleBulkAction("delete")}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
      </Box>

      {/* DataGrid */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <DataGrid
          rows={priceListings}
          rowHeight={70}
          columns={columns}
          getRowId={(row) => row.id}
          checkboxSelection
          pageSizeOptions={[25, 50, 75, 100]}
          rowCount={totalCount}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model: GridPaginationModel) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
          onRowClick={handleRowClick}
        />
      </Box>

      {/* Footer Pagination */}
      <Box
        sx={{
          p: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Pagination
          count={Math.ceil(totalCount / pageSize)}
          page={page + 1}
          onChange={(_, value) => setPage(value - 1)}
          sx={{ display: "flex", justifyContent: "flex-end" }}
        />
      </Box>

      {/* Drawer for read/edit a single PriceListing */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: { xs: "90%", sm: "350px", md: "50vw" },
            py: 10,
            px: 2,
          },
        }}
      >
        {selectedItem && drawerMode === "readOnly" && (
          <>
            <Typography variant="h6" gutterBottom>
              Price Listing Details
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Listing info as multiline read-only */}
              <TextField
                label="Listing"
                multiline
                minRows={3}
                value={
                  `${selectedItem.product_brand} ${selectedItem.product_name} - ${selectedItem.product_amount}\n` +
                  `${selectedItem.store_name}, ${selectedItem.store_address}\n` +
                  `${formatDate(selectedItem.date_added)}`
                }
                InputProps={{ readOnly: true }}
              />
              {/* Price read-only */}
              <TextField
                label="Price"
                value={`TT$${selectedItem.price.toFixed(2)}`}
                InputProps={{ readOnly: true }}
              />
              {/* Verified read-only */}
              <TextField
                label="Verified"
                value={selectedItem.price_is_verified}
              />
            </Box>

            <Box mt={3} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleDrawerClose}>
                Close
              </Button>
              <Stack direction="row" spacing={1}>
                <Button
                  onClick={() => setDrawerMode("edit")}
                  variant="contained"
                >
                  Edit
                </Button>
                <Button onClick={handleDelete} variant="outlined" color="error">
                  Delete
                </Button>
              </Stack>
            </Box>
          </>
        )}

        {selectedItem && drawerMode === "edit" && (
          <>
            <Typography variant="h6" gutterBottom>
              Edit Price Listing
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Listing read-only */}
              <TextField
                label="Listing"
                multiline
                minRows={3}
                value={
                  `${selectedItem.product_brand} ${selectedItem.product_name} - ${selectedItem.product_amount}\n` +
                  `${selectedItem.store_name}, ${selectedItem.store_address}\n` +
                  `${formatDate(selectedItem.date_added)}`
                }
                InputProps={{ readOnly: true }}
              />

              {/* Price read-only */}
              <TextField
                label="Price"
                value={`TT$${selectedItem.price.toFixed(2)}`}
                InputProps={{ readOnly: true }}
              />

              {/* Verified as a dropdown */}
              <FormControl fullWidth>
                <InputLabel id="price-verified-label">Verified?</InputLabel>
                <Select
                  labelId="price-verified-label"
                  label="Verified?"
                  value={formData.price_is_verified || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_is_verified: e.target.value,
                    })
                  }
                >
                  <MenuItem value="pending">pending</MenuItem>
                  <MenuItem value="verified">verified</MenuItem>
                  <MenuItem value="rejected">rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box mt={3} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleDrawerClose}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                Save
              </Button>
            </Box>
          </>
        )}
      </Drawer>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={async () => {
          await confirmDialog.onConfirm();
        }}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </Box>
  );
}
