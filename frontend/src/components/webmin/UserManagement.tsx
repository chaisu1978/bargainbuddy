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
  Button,
  TextField,
  IconButton,
  Avatar,
  Stack,
  FormControlLabel,
  Switch,
  Pagination,
  Drawer,
  useMediaQuery,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { FaSearch } from "react-icons/fa";
import {
  AddCircle as AddCircleIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  PersonAdd as PersonAddIcon,
  PersonOff as PersonOffIcon,
  Delete as DeleteIcon,
  People,
} from "@mui/icons-material";
import apiClient from "../../services/auth";
import {
  stringToColor,
  stringToContrastColor,
  generateAvatarLabel,
} from "../../utils/avatarUtils";

// Import our new reusable components
import ConfirmDialog from "./ConfirmDialog";
import CustomSnackbar from "./CustomSnackbar";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  is_active: boolean;
  is_superuser: boolean;
  // For creating/editing passwords:
  password?: string;
  confirm_password?: string;
}

type BulkAction =
  | "activate"
  | "deactivate"
  | "makeAdmin"
  | "removeAdmin"
  | "delete";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"readOnly" | "edit" | "new">(
    "readOnly"
  );
  const [formData, setFormData] = useState<Partial<User>>({});

  // For "loading spinner" in the drawer
  const [drawerLoading, setDrawerLoading] = useState(false);

  // ✅ For feedback (snackbar) - note we no longer manually render <Snackbar>, we use <CustomSnackbar>
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // ✅ For confirmations (single or bulk deletes, etc.) - we use <ConfirmDialog>
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isMedium = useMediaQuery(theme.breakpoints.down("md"));

  // -----------
  // 1) Build columns dynamically
  // -----------
  function getColumns(): GridColDef[] {
    const cols: GridColDef[] = [
      {
        field: "avatar",
        headerName: "",
        width: 60,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const row = params.row as User;
          const bgColor = stringToColor(`${row.first_name} ${row.last_name}`);
          const contrast = stringToContrastColor(
            `${row.first_name} ${row.last_name}`
          );
          return (
            <Avatar
              src={row.profile_picture || ""}
              sx={{
                bgcolor: row.profile_picture ? "transparent" : bgColor,
                color: row.profile_picture ? "inherit" : contrast,
                width: 36,
                height: 36,
                fontSize: 14,
              }}
            >
              {!row.profile_picture
                ? generateAvatarLabel(row.first_name, row.last_name)
                : ""}
            </Avatar>
          );
        },
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 120,
      },
    ];

    if (!isSmall) {
      cols.push({ field: "first_name", headerName: "First Name", flex: 1 });
      cols.push({ field: "last_name", headerName: "Last Name", flex: 1 });
    }

    if (!isMedium) {
      cols.push({
        field: "is_active",
        headerName: "Active",
        type: "boolean",
        width: 80,
      });
      cols.push({
        field: "is_superuser",
        headerName: "Admin",
        type: "boolean",
        width: 80,
      });
    }

    return cols;
  }

  // -----------
  // 2) Fetch users
  // -----------
  function fetchUsers(pageNum = 1, size = 25, search = "") {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    apiClient
      .get(`/webmin/users/?page=${pageNum}&page_size=${size}${searchParam}`)
      .then((response) => {
        if (response.data.results.length === 0 && pageNum > 1) {
          setPage(0);
        } else {
          setUsers(response.data.results);
          setTotalUsers(response.data.count);
        }
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch users.",
          severity: "error",
        });
      });
  }

  useEffect(() => {
    fetchUsers(page + 1, pageSize, searchTerm);
  }, [page, pageSize, searchTerm]);

  // -----------
  // 3) Handlers
  // -----------
  const handleSearch = () => {
    setPage(0);
    fetchUsers(1, pageSize, searchTerm);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setFormData({});
    setDrawerMode("new");
    setDrawerOpen(true);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setDrawerMode("edit");
  };

  // **Single Delete** -> confirm first
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setConfirmDialog({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${selectedUser.email}"?`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/webmin/users/${selectedUser.id}/`);
          setSnackbar({
            open: true,
            message: "User deleted.",
            severity: "info",
          });
          handleDrawerClose();
          fetchUsers(page + 1, pageSize, searchTerm);
        } catch (error) {
          console.error(error);
          setSnackbar({
            open: true,
            message: "Failed to delete user.",
            severity: "error",
          });
        }
      },
    });
  };

  // Called when user clicks a row
  const handleRowClick = async (params: any) => {
    setDrawerMode("readOnly");
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      // Potentially fetch fresh data from /users/<id>/ if desired.
      // For now, we trust row data:
      const userData = params.row as User;
      setSelectedUser(userData);
      setFormData({ ...userData });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to load user.",
        severity: "error",
      });
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
  };

  // -----------
  // 4) Save (create or update)
  // -----------
  const handleSaveUser = async () => {
    if (drawerMode === "new") {
      const { password, confirm_password } = formData;
      if (!password || !confirm_password) {
        setSnackbar({
          open: true,
          message: "Password is required.",
          severity: "error",
        });
        return;
      }
      if (password !== confirm_password) {
        setSnackbar({
          open: true,
          message: "Passwords do not match.",
          severity: "error",
        });
        return;
      }
    }

    try {
      if (drawerMode === "new") {
        await apiClient.post("/webmin/users/", formData);
        setSnackbar({
          open: true,
          message: "User created successfully.",
          severity: "success",
        });
      } else {
        if (!selectedUser) return;
        const payload = { ...formData };
        delete payload.profile_picture;

        await apiClient.patch(`/webmin/users/${selectedUser.id}/`, payload);
        setSnackbar({
          open: true,
          message: "User updated successfully.",
          severity: "success",
        });
      }
      handleDrawerClose();
      fetchUsers(page + 1, pageSize, searchTerm);
    } catch (error) {
      console.error("Error saving user:", error);
      setSnackbar({
        open: true,
        message: "Error saving user.",
        severity: "error",
      });
    }
  };

  // -----------
  // 5) Bulk Actions
  // -----------
  async function handleBulkAction(action: BulkAction) {
    if (action === "delete") {
      setConfirmDialog({
        open: true,
        title: "Delete Multiple Users",
        message: `Are you sure you want to delete ${rowSelectionModel.length} user(s)?`,
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
      for (const userId of rowSelectionModel) {
        if (action === "delete") {
          await apiClient.delete(`/webmin/users/${userId}/`);
        } else if (action === "activate") {
          await apiClient.patch(`/webmin/users/${userId}/`, {
            is_active: true,
          });
        } else if (action === "deactivate") {
          await apiClient.patch(`/webmin/users/${userId}/`, {
            is_active: false,
          });
        } else if (action === "makeAdmin") {
          await apiClient.patch(`/webmin/users/${userId}/`, {
            is_superuser: true,
          });
        } else if (action === "removeAdmin") {
          await apiClient.patch(`/webmin/users/${userId}/`, {
            is_superuser: false,
          });
        }
      }
      setSnackbar({
        open: true,
        message: "Bulk action completed.",
        severity: "success",
      });
      fetchUsers(page + 1, pageSize, searchTerm);
    } catch (err) {
      console.error("Bulk action error:", err);
      setSnackbar({
        open: true,
        message: "Bulk action failed.",
        severity: "error",
      });
    }
  }

  // -----------
  // 6) Render
  // -----------
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
      }}
    >
      {/* STICKY HEADER */}
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
        {/* Row 1: Title & New User */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <People />
            <Typography variant="h6">Users</Typography>
          </Box>
          <IconButton
            onClick={handleNewUser}
            type="button"
            size="medium"
            color="primary"
          >
            <AddCircleIcon fontSize="large" />
          </IconButton>
        </Box>

        {/* Row 2: Search + Bulk Actions */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
            <IconButton onClick={handleSearch} size="small">
              <FaSearch />
            </IconButton>
          </Box>

          {rowSelectionModel.length > 0 && (
            <Stack direction="row" spacing={1} mt={{ xs: 1, sm: 0 }}>
              <Tooltip title="Activate selected user(s)" arrow>
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleBulkAction("activate")}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Deactivate selected user(s)" arrow>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => handleBulkAction("deactivate")}
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Grant admin to selected user(s)" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleBulkAction("makeAdmin")}
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Remove admin from selected user(s)" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleBulkAction("removeAdmin")}
                >
                  <PersonOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete selected user(s)" arrow>
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

      {/* DATA GRID - SCROLLABLE AREA */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <DataGrid
          rows={users}
          columns={getColumns()}
          getRowId={(row) => row.id}
          checkboxSelection
          onRowClick={handleRowClick}
          pageSizeOptions={[25, 50, 75]}
          rowCount={totalUsers}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(params: GridPaginationModel) => {
            setPage(params.page);
            setPageSize(params.pageSize);
          }}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={setRowSelectionModel}
        />
      </Box>

      {/* PAGINATION FOOTER */}
      <Box
        sx={{
          p: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          borderRadius: "4px",
        }}
      >
        <Pagination
          count={Math.ceil(totalUsers / pageSize)}
          page={page + 1}
          onChange={(_, value) => setPage(value - 1)}
          sx={{ display: "flex", justifyContent: "flex-end" }}
        />
      </Box>

      {/* DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: { xs: "90%", sm: "350px", md: "50vw" },
            py: 10,
            px: 4,
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
        ) : drawerMode === "readOnly" && selectedUser ? (
          <>
            {/* TOP: Avatar & name */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                src={selectedUser.profile_picture || ""}
                sx={{
                  bgcolor: selectedUser.profile_picture
                    ? "transparent"
                    : stringToColor(
                        `${selectedUser.first_name} ${selectedUser.last_name}`
                      ),
                  color: selectedUser.profile_picture
                    ? "inherit"
                    : stringToContrastColor(
                        `${selectedUser.first_name} ${selectedUser.last_name}`
                      ),
                  width: 50,
                  height: 50,
                }}
              >
                {!selectedUser.profile_picture
                  ? generateAvatarLabel(
                      selectedUser.first_name,
                      selectedUser.last_name
                    )
                  : ""}
              </Avatar>
              <Typography variant="h6">
                {selectedUser.first_name} {selectedUser.last_name}
              </Typography>
            </Box>

            {/* Read-Only fields */}
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Email"
                value={selectedUser.email}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Phone Number"
                value={selectedUser.phone_number || ""}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="Address"
                value={selectedUser.address || ""}
                InputProps={{ readOnly: true }}
              />
              <FormControlLabel
                label="Active?"
                control={<Switch checked={selectedUser.is_active} disabled />}
              />
              <FormControlLabel
                label="Superuser?"
                control={
                  <Switch checked={selectedUser.is_superuser} disabled />
                }
              />
            </Box>

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleDrawerClose}>
                Close
              </Button>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleEditUser}>
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteUser}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          </>
        ) : drawerMode === "edit" || drawerMode === "new" ? (
          <>
            <Typography variant="h6" gutterBottom>
              {drawerMode === "new" ? "New User" : "Edit User"}
            </Typography>

            {/* Show avatar above the edit form (optional) */}
            {selectedUser && drawerMode === "edit" && (
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                  src={selectedUser.profile_picture || ""}
                  sx={{
                    bgcolor: selectedUser.profile_picture
                      ? "transparent"
                      : stringToColor(
                          `${selectedUser.first_name} ${selectedUser.last_name}`
                        ),
                    color: selectedUser.profile_picture
                      ? "inherit"
                      : stringToContrastColor(
                          `${selectedUser.first_name} ${selectedUser.last_name}`
                        ),
                    width: 50,
                    height: 50,
                  }}
                >
                  {!selectedUser.profile_picture
                    ? generateAvatarLabel(
                        selectedUser.first_name,
                        selectedUser.last_name
                      )
                    : ""}
                </Avatar>
                <Typography variant="h6">
                  {selectedUser.first_name} {selectedUser.last_name}
                </Typography>
              </Box>
            )}

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <TextField
                label="First Name"
                value={formData.first_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
              <TextField
                label="Last Name"
                value={formData.last_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />

              {drawerMode === "new" && (
                <>
                  <TextField
                    label="Password"
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={formData.confirm_password || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirm_password: e.target.value,
                      })
                    }
                  />
                </>
              )}

              <TextField
                label="Phone Number"
                value={formData.phone_number || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              />
              <TextField
                label="Address"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <FormControlLabel
                label="Active?"
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                }
              />
              <FormControlLabel
                label="Superuser?"
                control={
                  <Switch
                    checked={formData.is_superuser ?? false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_superuser: e.target.checked,
                      })
                    }
                  />
                }
              />
            </Box>

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleDrawerClose}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSaveUser}>
                Save
              </Button>
            </Box>
          </>
        ) : null}
      </Drawer>

      {/* ✅ REUSABLE SNACKBAR */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />

      {/* ✅ REUSABLE CONFIRM DIALOG */}
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
