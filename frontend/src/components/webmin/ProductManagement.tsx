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
  Button,
  TextField,
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { FaSearch, FaUpload } from "react-icons/fa";
import {
  AddCircle as AddCircleIcon,
  Delete as DeleteIcon,
  ImageSearch as ImageSearchIcon,
  ImageNotSupported as ImageNotSupportedIcon,
  ShoppingBag,
} from "@mui/icons-material";

import apiClient from "../../services/auth";
import ConfirmDialog from "./ConfirmDialog";
import CustomSnackbar from "./CustomSnackbar";
import {
  stringToColor,
  stringToContrastColor,
  generateAvatarLabel,
} from "../../utils/avatarUtils";

// --------------------
// 1) Type Definitions
// --------------------
interface Product {
  id: number;
  barcode?: string;
  name: string;
  brand?: string;
  amount?: string;
  description?: string;
  image_url?: string;
  img_is_verified?: string; // "pending" | "verified" | "rejected"
  category?: string;
  manufacturer?: string;
  option1name?: string;
  option1value?: string;
  option2name?: string;
  option2value?: string;
  option3name?: string;
  option3value?: string;
  option4name?: string;
  option4value?: string;
  option5name?: string;
  option5value?: string;
}

type BulkAction = "approveImage" | "rejectImage" | "delete";

export default function ProductManagement() {
  // --------------------
  // 2) State Variables
  // --------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  // For pagination
  const [page, setPage] = useState(0); // zero-based
  const [pageSize, setPageSize] = useState(50);

  // For search
  const [searchTerm, setSearchTerm] = useState("");

  // For bulk selection
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);

  // Drawer states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"readOnly" | "edit" | "new">(
    "readOnly"
  );
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [drawerLoading, setDrawerLoading] = useState(false);

  // For images in the drawer
  const [imageFile, setImageFile] = useState<File | null>(null);

  // For inline uploads
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rowForInlineUpload, setRowForInlineUpload] = useState<Product | null>(
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

  // For responsive columns
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isMedium = useMediaQuery(theme.breakpoints.down("md"));

  // ------------------------------------
  // 3) Build DataGrid Columns
  // ------------------------------------
  function getColumns(): GridColDef[] {
    const columns: GridColDef[] = [
      // Avatar Column
      {
        field: "avatar",
        headerName: "",
        width: 60,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const row = params.row as Product;
          if (row.image_url) {
            return (
              <Avatar
                src={row.image_url}
                variant="square"
                sx={{ width: 50, height: 50 }}
              />
            );
          }
          // Fallback color avatar
          const bgColor = stringToColor(row.name || "Product");
          const contrast = stringToContrastColor(row.name || "Product");
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
      // Show brand if not small
      !isSmall
        ? {
            field: "brand",
            headerName: "Brand",
            maxWidth: 150,
            flex: 1,
          }
        : ({} as GridColDef),

      // Always show Name
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 120,
      },

      // Show amount if not small
      !isSmall
        ? {
            field: "amount",
            headerName: "Amount",
            minWidth: 80,
            flex: 1,
          }
        : ({} as GridColDef),
    ];

    // If large, show "img_is_verified"
    if (!isMedium) {
      columns.push({
        field: "img_is_verified",
        headerName: "Img Verified",
        width: 120,
      });
    }

    // NEW: Add upload column at the end
    columns.push({
      field: "uploadImage",
      headerName: "Upload",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const row = params.row as Product;
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

    // Filter out placeholders if small
    return columns.filter((col) => Object.keys(col).length > 0);
  }

  // ------------------------------------
  // 4) Fetch Products (API Calls)
  // ------------------------------------
  function fetchProducts(pageNum = 1, size = 50, search = "") {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    apiClient
      .get(`/product/product/?page=${pageNum}&page_size=${size}${searchParam}`)
      .then((response) => {
        const results = response.data.results || [];
        if (results.length === 0 && pageNum > 1) {
          setPage(0); // Reset to first page if no data
        } else {
          setProducts(results);
          setTotalProducts(response.data.count);
        }
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch products.",
          severity: "error",
        });
      });
  }

  useEffect(() => {
    // Convert zero-based page to one-based for the backend
    fetchProducts(page + 1, pageSize, searchTerm);
  }, [page, pageSize, searchTerm]);

  // ------------------------------------
  // 5) Inline Upload Logic
  // ------------------------------------
  const handleInlineImageClick = (row: Product) => {
    setRowForInlineUpload(row);
    // Open hidden <input type="file" />
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
        `/product/product/${rowForInlineUpload.id}/upload_image/`,
        formDataImg
      );
      setSnackbar({
        open: true,
        message: `Image uploaded for "${rowForInlineUpload.name}".`,
        severity: "success",
      });
      fetchProducts(page + 1, pageSize, searchTerm);
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

  // ------------------------------------
  // 6) Standard Handlers
  // ------------------------------------
  const handleSearch = () => {
    setPage(0);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setFormData({});
    setImageFile(null);
    setDrawerMode("new");
    setDrawerOpen(true);
  };

  const handleRowClick = async (params: any) => {
    setDrawerMode("readOnly");
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const rowData = params.row as Product;
      setSelectedProduct(rowData);
      setFormData({ ...rowData });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to load product.",
        severity: "error",
      });
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedProduct(null);
  };

  // ------------------------------------
  // 7) Create / Update
  // ------------------------------------
  const handleSaveProduct = async () => {
    try {
      let newOrUpdatedId = selectedProduct?.id;

      if (drawerMode === "new") {
        // Create
        const resp = await apiClient.post("/product/product/", formData);
        newOrUpdatedId = resp.data.id;
        setSnackbar({
          open: true,
          message: "Product created successfully.",
          severity: "success",
        });
      } else {
        // Edit
        if (!selectedProduct) return;
        await apiClient.patch(
          `/product/product/${selectedProduct.id}/`,
          formData
        );
        newOrUpdatedId = selectedProduct.id;
        setSnackbar({
          open: true,
          message: "Product updated successfully.",
          severity: "success",
        });
      }

      // If user selected a file in the drawer
      if (imageFile && newOrUpdatedId) {
        const formDataImg = new FormData();
        formDataImg.append("image", imageFile);
        await apiClient.put(
          `/product/product/${newOrUpdatedId}/upload_image/`,
          formDataImg
        );
        setImageFile(null);
      }

      handleDrawerClose();
      fetchProducts(page + 1, pageSize, searchTerm);
    } catch (error) {
      console.error("Error saving product:", error);
      setSnackbar({
        open: true,
        message: "Error saving product.",
        severity: "error",
      });
    }
  };

  // ------------------------------------
  // 8) Delete Single Product
  // ------------------------------------
  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    setConfirmDialog({
      open: true,
      title: "Delete Product",
      message: `Are you sure you want to delete "${selectedProduct.name}"?`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/product/product/${selectedProduct.id}/`);
          setSnackbar({
            open: true,
            message: "Product deleted.",
            severity: "info",
          });
          handleDrawerClose();
          fetchProducts(page + 1, pageSize, searchTerm);
        } catch (error) {
          console.error(error);
          setSnackbar({
            open: true,
            message: "Failed to delete product.",
            severity: "error",
          });
        }
      },
    });
  };

  // ------------------------------------
  // 9) Bulk Actions
  // ------------------------------------
  async function handleBulkAction(action: BulkAction) {
    if (action === "delete") {
      setConfirmDialog({
        open: true,
        title: "Delete Multiple Products",
        message: `Are you sure you want to delete ${rowSelectionModel.length} product(s)?`,
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
      for (const productId of rowSelectionModel) {
        if (action === "delete") {
          await apiClient.delete(`/product/product/${productId}/`);
        } else if (action === "approveImage") {
          await apiClient.patch(`/product/product-img-verified/${productId}/`, {
            img_is_verified: "verified",
          });
        } else if (action === "rejectImage") {
          await apiClient.patch(`/product/product-img-verified/${productId}/`, {
            img_is_verified: "rejected",
          });
        }
      }
      setSnackbar({
        open: true,
        message: "Bulk action completed.",
        severity: "success",
      });
      fetchProducts(page + 1, pageSize, searchTerm);
    } catch (err) {
      console.error("Bulk action error:", err);
      setSnackbar({
        open: true,
        message: "Bulk action failed.",
        severity: "error",
      });
    }
  }

  // ------------------------------------
  // 10) Render
  // ------------------------------------
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* Hidden input for inline image uploads */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleInlineFileChange}
      />

      {/* Sticky Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          backgroundColor: "background.default",
          pb: 1,
          pt: 0,
        }}
      >
        {/* Title & Add Button */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <ShoppingBag />
            <Typography variant="h6">Products</Typography>
          </Box>
          <IconButton
            onClick={handleNewProduct}
            type="button"
            size="medium"
            color="primary"
          >
            <AddCircleIcon fontSize="large" />
          </IconButton>
        </Box>

        {/* Search + Bulk Actions */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
        >
          {/* Search Section */}
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search by name, brand, amount, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
            <IconButton onClick={handleSearch} size="small">
              <FaSearch />
            </IconButton>
          </Box>

          {/* Bulk Actions Section */}
          {rowSelectionModel.length > 0 && (
            <Stack direction="row" spacing={1} mt={{ xs: 1, sm: 0 }}>
              <Tooltip title="Approve product image" arrow>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleBulkAction("approveImage")}
                >
                  <ImageSearchIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Reject product image" arrow>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleBulkAction("rejectImage")}
                >
                  <ImageNotSupportedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete selected product(s)" arrow>
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

      {/* DataGrid List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <DataGrid
          rows={products}
          columns={getColumns()}
          getRowId={(row) => row.id}
          checkboxSelection
          onRowClick={handleRowClick}
          pageSizeOptions={[25, 50, 75, 100]}
          rowCount={totalProducts}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(params: GridPaginationModel) => {
            // MUI zero-based
            setPage(params.page);
            setPageSize(params.pageSize);
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
          count={Math.ceil(totalProducts / pageSize)}
          page={page + 1} // convert back to 1-based
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
            width: { xs: "90%", sm: "350px", md: "50vw" },
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
        ) : drawerMode === "readOnly" && selectedProduct ? (
          <>
            {/* READ-ONLY VIEW */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                src={selectedProduct.image_url || ""}
                variant="square"
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: !selectedProduct.image_url
                    ? stringToColor(selectedProduct.name)
                    : "transparent",
                  color: !selectedProduct.image_url
                    ? stringToContrastColor(selectedProduct.name)
                    : "inherit",
                }}
              >
                {!selectedProduct.image_url
                  ? generateAvatarLabel(selectedProduct.name, "")
                  : ""}
              </Avatar>
              <Typography variant="h6">{selectedProduct.name}</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Barcode"
                value={selectedProduct.barcode || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Brand"
                value={selectedProduct.brand || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Amount"
                value={selectedProduct.amount || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Category"
                value={selectedProduct.category || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Manufacturer"
                value={selectedProduct.manufacturer || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Description"
                value={selectedProduct.description || ""}
                multiline
                minRows={2}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label={selectedProduct.option1name || "Option1"}
                value={selectedProduct.option1value || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label={selectedProduct.option2name || "Option2"}
                value={selectedProduct.option2value || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label={selectedProduct.option3name || "Option3"}
                value={selectedProduct.option3value || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label={selectedProduct.option4name || "Option4"}
                value={selectedProduct.option4value || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label={selectedProduct.option5name || "Option5"}
                value={selectedProduct.option5value || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Image Verified?"
                value={selectedProduct.img_is_verified || "pending"}
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
                  onClick={handleDeleteProduct}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          </>
        ) : drawerMode === "edit" || drawerMode === "new" ? (
          <>
            {/* EDIT/NEW FORM */}
            <Typography variant="h6" gutterBottom>
              {drawerMode === "new" ? "New Product" : "Edit Product"}
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Barcode"
                value={formData.barcode || ""}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
              />
              <TextField
                label="Name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <TextField
                label="Brand"
                value={formData.brand || ""}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
              <TextField
                label="Amount"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              <TextField
                label="Category"
                value={formData.category || ""}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
              <TextField
                label="Manufacturer"
                value={formData.manufacturer || ""}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
              />
              <TextField
                label="Description"
                multiline
                minRows={2}
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              {/* Options 1-5 */}
              <TextField
                label="Option1 Name"
                value={formData.option1name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option1name: e.target.value })
                }
              />
              <TextField
                label="Option1 Value"
                value={formData.option1value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option1value: e.target.value })
                }
              />
              <TextField
                label="Option2 Name"
                value={formData.option2name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option2name: e.target.value })
                }
              />
              <TextField
                label="Option2 Value"
                value={formData.option2value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option2value: e.target.value })
                }
              />
              <TextField
                label="Option3 Name"
                value={formData.option3name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option3name: e.target.value })
                }
              />
              <TextField
                label="Option3 Value"
                value={formData.option3value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option3value: e.target.value })
                }
              />
              <TextField
                label="Option4 Name"
                value={formData.option4name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option4name: e.target.value })
                }
              />
              <TextField
                label="Option4 Value"
                value={formData.option4value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option4value: e.target.value })
                }
              />
              <TextField
                label="Option5 Name"
                value={formData.option5name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option5name: e.target.value })
                }
              />
              <TextField
                label="Option5 Value"
                value={formData.option5value || ""}
                onChange={(e) =>
                  setFormData({ ...formData, option5value: e.target.value })
                }
              />
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

              {/* For uploading an image in the drawer */}
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
              <Button variant="contained" onClick={handleSaveProduct}>
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
