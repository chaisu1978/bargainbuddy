import { useEffect, useState, useRef } from "react";
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
  Avatar,
  Stack,
  Pagination,
  Drawer,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { FaSearch, FaUpload } from "react-icons/fa";
import {
  AddCircle as AddCircleIcon,
  Delete as DeleteIcon,
  ImageSearch as ImageSearchIcon,
  ImageNotSupported as ImageNotSupportedIcon,
  Storefront,
} from "@mui/icons-material";

import apiClient from "../../services/auth";
import ConfirmDialog from "./ConfirmDialog";
import CustomSnackbar from "./CustomSnackbar";
import {
  stringToColor,
  stringToContrastColor,
  generateAvatarLabel,
} from "../../utils/avatarUtils";

/** ---------------------------
 * 1) Type Definitions
 * --------------------------*/
interface Store {
  id: number;
  name: string;
  address?: string;
  lat?: string;
  lon?: string;
  image?: string; // URL or base path to the store’s image
  phone_number?: string;
  email?: string;
  website?: string;
  opening_hours?: string;
  /** The numeric or string region used for POST/PATCH */
  region?: string | number;
  /** The actual text name of the region, e.g. "North" */
  region_name?: string;
  store_type?: string;
  parking_availability?: string;
  wheelchair_accessible?: string;
  additional_info?: string;
  date_added?: string;
  /** "pending", "verified", or "rejected" */
  img_is_verified?: string;
}

type BulkAction = "approveImage" | "rejectImage" | "delete";

/** ---------------------------
 * StoreManagement Component
 * --------------------------*/
export default function StoreManagement() {
  /** ---------------------------
   * 2) State Variables
   * --------------------------*/
  const [stores, setStores] = useState<Store[]>([]);
  const [totalStores, setTotalStores] = useState(0);

  // For pagination (DataGrid uses zero-based, DRF is one-based)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // For search
  const [searchTerm, setSearchTerm] = useState("");

  // For bulk selection
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);

  // Drawer states
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"readOnly" | "edit" | "new">(
    "readOnly"
  );
  const [formData, setFormData] = useState<Partial<Store>>({});
  const [drawerLoading, setDrawerLoading] = useState(false);

  // For images (inline & in-drawer)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rowForInlineUpload, setRowForInlineUpload] = useState<Store | null>(
    null
  );

  // Snackbar & Confirm
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info" | "warning",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  /** 3) Media Query for small screens */
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  /** 4) Hard-code region options for the <Select> in the drawer */
  const regionOptions = ["North", "South", "Central", "East", "West", "Tobago"];

  /** ---------------------------
   * 5) Build DataGrid Columns
   * --------------------------*/
  function getColumns(): GridColDef[] {
    // Base columns always included:
    const columns: GridColDef[] = [
      {
        // Avatar
        field: "avatar",
        headerName: "",
        width: 60,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const row = params.row as Store;
          if (row.image) {
            return (
              <Avatar
                src={row.image}
                variant="square"
                sx={{ width: 50, height: 50 }}
              />
            );
          }
          // If no image, fallback to color avatar
          const bgColor = stringToColor(row.name || "");
          const contrast = stringToContrastColor(row.name || "");
          return (
            <Avatar
              variant="square"
              sx={{
                bgcolor: bgColor,
                color: contrast,
                width: 50,
                height: 50,
              }}
            >
              {generateAvatarLabel(row.name, "")}
            </Avatar>
          );
        },
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 150,
      },
    ];

    // Additional columns only on bigger screens:
    if (!isSmall) {
      columns.push(
        {
          field: "address",
          headerName: "Address",
          flex: 1,
          minWidth: 120,
        },
        {
          /** We display region_name so user sees "North" etc. */
          field: "region_name",
          headerName: "Region",
          flex: 1,
          minWidth: 100,
        },
        {
          field: "img_is_verified",
          headerName: "Img Verified",
          width: 110,
        }
      );
    }

    // Upload column (always)
    columns.push({
      field: "uploadImage",
      headerName: "Upload",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params.row as Store;
        return (
          <Tooltip title="Upload new image inline" arrow>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleInlineImageClick(row)}
            >
              <FaUpload />
            </IconButton>
          </Tooltip>
        );
      },
    });

    return columns;
  }

  /** ---------------------------
   * 6) Fetch Stores + Search
   * --------------------------*/
  function fetchStores(pageNum = 1, size = 50, search = "") {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    apiClient
      .get(`/store/store/?page=${pageNum}&page_size=${size}${searchParam}`)
      .then((response) => {
        const results = response.data.results || [];
        if (results.length === 0 && pageNum > 1) {
          // If no data on current page, reset to page 0
          setPage(0);
        } else {
          setStores(results);
          setTotalStores(response.data.count);
        }
      })
      .catch((error) => {
        console.error("Error fetching stores:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch stores.",
          severity: "error",
        });
      });
  }

  useEffect(() => {
    // Convert zero-based page to one-based
    fetchStores(page + 1, pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm]);

  /** ---------------------------
   * 7) Inline Image Upload
   * --------------------------*/
  const handleInlineImageClick = (row: Store) => {
    setRowForInlineUpload(row);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleInlineFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!rowForInlineUpload) return;
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    try {
      const formDataImg = new FormData();
      formDataImg.append("image", file);

      await apiClient.put(
        `/store/store/${rowForInlineUpload.id}/store-image-upload/`,
        formDataImg
      );
      setSnackbar({
        open: true,
        message: `Image uploaded for "${rowForInlineUpload.name}".`,
        severity: "success",
      });
      fetchStores(page + 1, pageSize, searchTerm);
    } catch (error) {
      console.error("Inline image upload error:", error);
      setSnackbar({
        open: true,
        message: "Failed to upload image.",
        severity: "error",
      });
    } finally {
      setRowForInlineUpload(null);
      e.target.value = "";
    }
  };

  /** ---------------------------
   * 8) Standard Handlers
   * --------------------------*/
  const handleSearch = () => {
    setPage(0);
  };

  const handleNewStore = () => {
    setSelectedStore(null);
    setFormData({});
    setImageFile(null);
    setDrawerMode("new");
    setDrawerOpen(true);
  };

  /**
   * Show the Drawer in read-only mode on row click.
   * Also load `formData` with the store data, but
   * for editing we want `region = store.region_name`.
   */
  const handleRowClick = async (params: any) => {
    setDrawerMode("readOnly");
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const rowData = params.row as Store;
      // E.g. rowData.region might be a number, region_name might be "North".
      setSelectedStore(rowData);

      // If later we switch to "edit" mode, we'll want formData.region = "North"
      // so that the <Select> picks the correct item.
      setFormData({
        ...rowData,
        region: rowData.region_name || "",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to load store.",
        severity: "error",
      });
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedStore(null);
  };

  /** ---------------------------
   * 9) Create / Update
   * --------------------------*/
  const handleSaveStore = async () => {
    try {
      let newOrUpdatedId = selectedStore?.id;

      // If we have formData.image that's a string, remove it before sending
      const patchData = { ...formData };
      if (patchData.image && typeof patchData.image === "string") {
        delete patchData.image;
      }

      if (drawerMode === "new") {
        // POST
        const resp = await apiClient.post("/store/store/", patchData);
        newOrUpdatedId = resp.data.id;
        setSnackbar({
          open: true,
          message: "Store created successfully.",
          severity: "success",
        });
      } else {
        // PATCH
        if (!selectedStore) return;
        await apiClient.patch(`/store/store/${selectedStore.id}/`, patchData);
        newOrUpdatedId = selectedStore.id;
        setSnackbar({
          open: true,
          message: "Store updated successfully.",
          severity: "success",
        });
      }

      // If a file was selected in the drawer, upload it
      if (imageFile && newOrUpdatedId) {
        const formDataImg = new FormData();
        formDataImg.append("image", imageFile);
        await apiClient.put(
          `/store/store/${newOrUpdatedId}/store-image-upload/`,
          formDataImg
        );
        setImageFile(null);
      }

      handleDrawerClose();
      fetchStores(page + 1, pageSize, searchTerm);
    } catch (error) {
      console.error("Error saving store:", error);
      setSnackbar({
        open: true,
        message: "Error saving store.",
        severity: "error",
      });
    }
  };

  /** ---------------------------
   * 10) Delete Single
   * --------------------------*/
  const handleDeleteStore = () => {
    if (!selectedStore) return;
    setConfirmDialog({
      open: true,
      title: "Delete Store",
      message: `Are you sure you want to delete "${selectedStore.name}"?`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/store/store/${selectedStore.id}/`);
          setSnackbar({
            open: true,
            message: "Store deleted.",
            severity: "info",
          });
          handleDrawerClose();
          fetchStores(page + 1, pageSize, searchTerm);
        } catch (error) {
          console.error(error);
          setSnackbar({
            open: true,
            message: "Failed to delete store.",
            severity: "error",
          });
        }
      },
    });
  };

  /** ---------------------------
   * 11) Bulk Actions
   * --------------------------*/
  async function handleBulkAction(action: BulkAction) {
    if (action === "delete") {
      setConfirmDialog({
        open: true,
        title: "Delete Multiple Stores",
        message: `Are you sure you want to delete ${rowSelectionModel.length} store(s)?`,
        onConfirm: async () => {
          await performBulkAction(action);
        },
      });
    } else {
      await performBulkAction(action);
    }
  }

  async function performBulkAction(action: BulkAction) {
    try {
      for (const storeId of rowSelectionModel) {
        if (action === "delete") {
          await apiClient.delete(`/store/store/${storeId}/`);
        } else if (action === "approveImage") {
          await apiClient.patch(`/store/store-img-verified/${storeId}/`, {
            img_is_verified: "verified",
          });
        } else if (action === "rejectImage") {
          await apiClient.patch(`/store/store-img-verified/${storeId}/`, {
            img_is_verified: "rejected",
          });
        }
      }
      setSnackbar({
        open: true,
        message: "Bulk action completed.",
        severity: "success",
      });
      fetchStores(page + 1, pageSize, searchTerm);
    } catch (err) {
      console.error("Bulk action error:", err);
      setSnackbar({
        open: true,
        message: "Bulk action failed.",
        severity: "error",
      });
    }
  }

  /** ---------------------------
   * 12) Render
   * --------------------------*/
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Hidden file input for inline uploads */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleInlineFileChange}
      />

      {/* Sticky Header: Title, Search, Bulk Actions */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          backgroundColor: "background.default",
          pb: 1,
        }}
      >
        {/* Title & Add */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Storefront />
            <Typography variant="h6">Stores</Typography>
          </Box>
          <IconButton onClick={handleNewStore} size="medium" color="primary">
            <AddCircleIcon fontSize="large" />
          </IconButton>
        </Box>

        {/* Search + Bulk */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
        >
          {/* Search */}
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search by name, address, region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
            <IconButton onClick={handleSearch} size="small">
              <FaSearch />
            </IconButton>
          </Box>

          {/* Bulk Actions */}
          {rowSelectionModel.length > 0 && (
            <Stack direction="row" spacing={1} mt={{ xs: 1, sm: 0 }}>
              <Tooltip title="Approve store image" arrow>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleBulkAction("approveImage")}
                >
                  <ImageSearchIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject store image" arrow>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleBulkAction("rejectImage")}
                >
                  <ImageNotSupportedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete selected store(s)" arrow>
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
          rows={stores}
          columns={getColumns()}
          getRowId={(row) => row.id}
          checkboxSelection
          onRowClick={handleRowClick}
          pageSizeOptions={[25, 50, 75, 100]}
          rowCount={totalStores}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model: GridPaginationModel) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
        />
      </Box>

      {/* Pagination Footer */}
      <Box
        sx={{
          p: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Pagination
          count={Math.ceil(totalStores / pageSize)}
          page={page + 1}
          onChange={(_, value) => setPage(value - 1)}
          sx={{ display: "flex", justifyContent: "flex-end" }}
        />
      </Box>

      {/* Drawer (View/Edit/New) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: { xs: "90%", sm: "400px", md: "50vw" },
            py: 10,
            px: 2,
          },
        }}
      >
        {drawerLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : drawerMode === "readOnly" && selectedStore ? (
          <>
            {/* READ-ONLY */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                src={selectedStore.image || ""}
                variant="square"
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: !selectedStore.image
                    ? stringToColor(selectedStore.name)
                    : "transparent",
                  color: !selectedStore.image
                    ? stringToContrastColor(selectedStore.name)
                    : "inherit",
                }}
              >
                {!selectedStore.image
                  ? generateAvatarLabel(selectedStore.name, "")
                  : ""}
              </Avatar>
              <Typography variant="h6" mb={2}>
                {selectedStore.name}
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Address"
                value={selectedStore.address || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Lat"
                value={selectedStore.lat || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Lon"
                value={selectedStore.lon || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Phone"
                value={selectedStore.phone_number || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Email"
                value={selectedStore.email || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Website"
                value={selectedStore.website || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Opening Hours"
                value={selectedStore.opening_hours || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Region"
                /** Show region_name, e.g. "North" */
                value={selectedStore.region_name || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Store Type"
                value={selectedStore.store_type || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Parking Availability"
                value={selectedStore.parking_availability || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Wheelchair Accessible"
                value={selectedStore.wheelchair_accessible || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Additional Info"
                value={selectedStore.additional_info || ""}
                multiline
                minRows={2}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Image Verified?"
                value={selectedStore.img_is_verified || "pending"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleDrawerClose}>
                Close
              </Button>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => setDrawerMode("edit")}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteStore}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          </>
        ) : drawerMode === "edit" || drawerMode === "new" ? (
          <>
            {/* EDIT/NEW FORM */}
            <Typography variant="h6" mb={2}>
              {drawerMode === "new" ? "New Store" : "Edit Store"}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <TextField
                label="Address"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <TextField
                label="Lat"
                value={formData.lat || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lat: e.target.value })
                }
              />
              <TextField
                label="Lon"
                value={formData.lon || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lon: e.target.value })
                }
              />
              <TextField
                label="Phone Number"
                value={formData.phone_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              />
              <TextField
                label="Email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <TextField
                label="Website"
                value={formData.website || ""}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
              <TextField
                label="Opening Hours"
                value={formData.opening_hours || ""}
                onChange={(e) =>
                  setFormData({ ...formData, opening_hours: e.target.value })
                }
              />

              {/* Region SELECT (we store the user-chosen string in formData.region) */}
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  label="Region"
                  value={(formData.region as string) || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                >
                  {regionOptions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* store_type, parking_availability, etc. */}
              <TextField
                label="Store Type"
                value={formData.store_type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, store_type: e.target.value })
                }
              />
              <TextField
                label="Parking Availability"
                value={formData.parking_availability || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parking_availability: e.target.value,
                  })
                }
              />
              <TextField
                label="Wheelchair Accessible"
                value={formData.wheelchair_accessible || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wheelchair_accessible: e.target.value,
                  })
                }
              />
              <TextField
                label="Additional Info"
                multiline
                minRows={2}
                value={formData.additional_info || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additional_info: e.target.value,
                  })
                }
              />

              {/* Image Verified Select */}
              <FormControl>
                <InputLabel>Image Verified?</InputLabel>
                <Select
                  value={formData.img_is_verified || "pending"}
                  label="Image Verified?"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      img_is_verified: e.target.value,
                    })
                  }
                >
                  <MenuItem value="pending">pending</MenuItem>
                  <MenuItem value="verified">verified</MenuItem>
                  <MenuItem value="rejected">rejected</MenuItem>
                </Select>
              </FormControl>

              {/* File Upload in drawer */}
              <Box display="flex" alignItems="center" gap={1}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<FaUpload />}
                >
                  {imageFile ? "Image Selected" : "Select Image"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {imageFile && (
                  <Typography variant="body2">{imageFile.name}</Typography>
                )}
              </Box>
            </Box>

            <Box mt={3} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleDrawerClose}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSaveStore}>
                Save
              </Button>
            </Box>
          </>
        ) : null}
      </Drawer>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={async () => {
          await confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, open: false });
        }}
        onClose={() =>
          setConfirmDialog({
            open: false,
            title: "",
            message: "",
            onConfirm: () => {},
          })
        }
      />
    </Box>
  );
}
