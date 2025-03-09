import { useState, useEffect, useCallback } from "react";
import { debounce } from "../../utils/debounce";
import { styled } from "@mui/material/styles";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputLabel,
  Avatar,
  SelectChangeEvent,
  Divider,
  IconButton,
  Autocomplete,
  FormControl,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import { FaEdit, FaSave, FaPlus, FaCamera } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import apiClient from "../../services/auth";
import { loginSuccess } from "../../store/authSlice";
import ThemeToggle from "../common/ThemeToggle";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
  color: "green",
});

type StoreOption = {
  id: number;
  name: string;
  address: string;
};

const AddPreferredStore = ({
  onStoreSelect,
  onInputValueChange,
  currentInputValue,
  selectedStore, // Add this prop
}: {
  onStoreSelect: (store: StoreOption | null) => void;
  onInputValueChange: (value: string) => void;
  currentInputValue: string;
  selectedStore: StoreOption | null; // Type the prop
}) => {
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStores = useCallback(
    debounce(async (query: string) => {
      if (query.length > 0) {
        setLoading(true);
        try {
          const response = await apiClient.get(
            `/search-suggest/search-suggest/`,
            {
              params: { query, type: "store" },
            }
          );
          setStoreOptions(response.data.stores || []);
        } catch (error) {
          console.error("Failed to fetch store suggestions:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setStoreOptions([]);
      }
    }, 300), // Delay of 300ms
    []
  );

  useEffect(() => {
    fetchStores(currentInputValue); // Debounced function call
  }, [currentInputValue, fetchStores]);

  return (
    <Autocomplete
      options={storeOptions}
      value={selectedStore} // Use the passed selectedStore prop
      inputValue={currentInputValue}
      getOptionLabel={(option) => `${option.name}, ${option.address}`}
      loading={loading}
      onInputChange={(_, value) => {
        onInputValueChange(value);
      }}
      onChange={(_, value) => {
        onStoreSelect(value || null);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Add Preferred Store" />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Box>
            <Typography variant="body1">{option.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {option.address}
            </Typography>
          </Box>
        </li>
      )}
      sx={{ flex: 1 }}
    />
  );
};

const ProfilePage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [region, setRegion] = useState("Everywhere");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null); // For previewing the image
  const [preferredStores, setPreferredStores] = useState<StoreOption[]>([]);
  const [currentInputValue, setCurrentInputValue] = useState<string>(""); // Ensure this is correctly declared
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);

  const [form, setForm] = useState<{
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    profile_picture: File | null; // Store File object for upload
    preferred_stores: never[];
    preferred_region: string;
    email_notifications: boolean;
    push_notifications: boolean;
    theme_mode: string;
  }>({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    profile_picture: null, // Initialize as null
    preferred_stores: [],
    preferred_region: "",
    email_notifications: false,
    push_notifications: false,
    theme_mode: "light",
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/core/me/");
        setForm(data);

        // Populate preferred stores
        setPreferredStores(data.preferred_stores || []);

        // If a profile picture exists, set it as the initial preview
        if (data.profile_picture) {
          setPreviewImage(data.profile_picture); // Use URL from backend
        }
        setRegion(data.preferred_region?.region || "Everywhere");
      } catch (error) {
        console.error("Failed to load user data.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!form.first_name || !form.last_name || !form.email) {
      setSnackbarMessage("All fields are required.");
      setSnackbarOpen(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setSnackbarMessage("Invalid email format.");
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);

      // Check if a new profile picture is selected
      if (form.profile_picture instanceof File) {
        const imageData = new FormData();
        imageData.append("profile_picture", form.profile_picture);

        try {
          await apiClient.post("/core/profile-image-upload/", imageData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (error) {
          console.error("Failed to upload profile picture:", error);
          setSnackbarMessage("Failed to upload profile picture.");
          setSnackbarOpen(true);
          setLoading(false);
          return; // Stop further execution if profile picture upload fails
        }
      }

      // Update other profile details
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number,
      };

      const { data } = await apiClient.patch("/core/me/", payload);
      dispatch(loginSuccess(data)); // Update the Redux state
      setEditing(false);
      setSnackbarMessage("Profile updated successfully.");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setSnackbarMessage("Failed to update profile.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (
    _: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return; // Ignore clicks outside the Snackbar
    setSnackbarOpen(false); // Close the Snackbar
  };

  const stringToColor = (string: string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  function stringToContrastColor(string: string) {
    const hex = stringToColor(string);
    const contrastHex = hex.replace("#", "");
    const r = parseInt(contrastHex.substr(0, 2), 16);
    const g = parseInt(contrastHex.substr(2, 2), 16);
    const b = parseInt(contrastHex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  }

  const stringAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((part) => part[0]?.toUpperCase())
      .join("");

    return {
      sx: {
        bgcolor: stringToColor(name),
        color: "white",
      },
      children: initials || "U",
    };
  };

  const handleRegionChange = (event: SelectChangeEvent<string>) => {
    const selectedRegion = event.target.value || "Everywhere";
    setRegion(selectedRegion);

    apiClient
      .patch("/core/update-region/", { region: selectedRegion })
      .then(() => {
        setSnackbarMessage("Region updated successfully.");
        setSnackbarOpen(true);
      })
      .catch((error) => {
        console.error("Failed to update region:", error);
        setSnackbarMessage("Failed to update region.");
        setSnackbarOpen(true);
      });
  };

  const handleNewAvatarPreview = {
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setForm((prev) => ({
          ...prev,
          profile_picture: file, // Store the file for upload
        }));

        // Generate preview
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImage(reader.result as string); // Use base64 for preview
        };
        reader.readAsDataURL(file);

        const fileName =
          file.name.length > 12
            ? `${file.name.slice(0, 9)}...${file.name.slice(-3)}`
            : file.name;
        setSnackbarMessage(`Selected file successfully: ${fileName}`);
        setSnackbarOpen(true);
      }
    },
  };

  const handleNotificationToggle = (field: string, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    apiClient
      .patch("/core/me/", { [field]: value })
      .then(() => {
        setSnackbarMessage(`${field.replace("_", " ")} updated successfully.`);
        setSnackbarOpen(true);
      })
      .catch((error) => {
        console.error(`Failed to update ${field}:`, error);
        setSnackbarMessage(`Failed to update ${field.replace("_", " ")}.`);
        setSnackbarOpen(true);
      });
  };

  const handleAddStore = (store: StoreOption) => {
    if (preferredStores.find((s) => s.id === store.id)) {
      setSnackbarMessage("Store is already in your preferred list.");
      setSnackbarOpen(true);
      return;
    }

    setPreferredStores((prev) => [...prev, store]);

    // Save to backend
    apiClient
      .post("/core/add-preferred-store/", { store_id: store.id })
      .then(() => {
        setSnackbarMessage("Store added successfully.");
        setSnackbarOpen(true);
      })
      .catch((err) => {
        console.error("Error adding store:", err);
        setSnackbarMessage("Failed to add store.");
        setSnackbarOpen(true);
      });
  };

  const handleDeleteStore = (storeId: number) => {
    setPreferredStores((prev) => prev.filter((store) => store.id !== storeId));

    // Delete from backend
    apiClient
      .delete(`/core/remove-preferred-store/`, { data: { store_id: storeId } })
      .then(() => {
        setSnackbarMessage("Store removed successfully.");
        setSnackbarOpen(true);
      })
      .catch((err) => {
        console.error("Error removing store:", err);
        setSnackbarMessage("Failed to remove store.");
        setSnackbarOpen(true);
      });
  };

  const handleAddStoreButtonClick = () => {
    if (selectedStore) {
      handleAddStore(selectedStore);
      setSelectedStore(null); // Clear the selected store after adding
      setCurrentInputValue(""); // Clear the autocomplete input value
    } else {
      console.log("No store selected.");
    }
  };

  return (
    <Container sx={{ marginY: 2, minHeight: "100vh", paddingX: 3 }}>
      <Box>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ marginTop: 0, marginBottom: 2 }}
        >
          Profile & Settings
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "flex-start",
            gap: 3,
          }}
        >
          <Box
            component="div"
            width={{ xs: "100%", sm: "50%" }}
            id="profile-info"
            sx={{
              padding: 2,
              backgroundColor: "background.paper",
              borderRadius: "4px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Typography
                variant="body1"
                fontWeight={"600"}
                fontSize={"1rem"}
                marginBottom={2}
                gutterBottom
              >
                User Information
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "flex-end",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 0.5,
                }}
              >
                <Button
                  type="button"
                  size="small"
                  variant="contained"
                  color="secondary"
                  sx={{ marginX: 0.5, marginY: 0.5 }}
                  startIcon={<FaEdit />}
                  onClick={() => setEditing((prev) => !prev)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="small"
                  variant="contained"
                  color="primary"
                  sx={{ marginX: 0.5, marginY: 0.5 }}
                  disabled={!editing || loading}
                  onClick={handleSave}
                  startIcon={<FaSave />}
                >
                  Save
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <Avatar
                {...stringAvatar(
                  `${form.first_name || ""} ${form.last_name || ""}`
                )}
                src={previewImage || undefined} // Use previewImage for display
                sx={{
                  width: 75,
                  height: 75,
                  marginRight: 2,
                  border: "2px solid",
                  borderColor: "secondary.main",
                  backgroundColor: stringToColor(
                    `${user?.first_name} ${user?.last_name}`.trim() || "User"
                  ),
                  color: stringToContrastColor(
                    `${user?.first_name} ${user?.last_name}`.trim() || "User"
                  ),
                }}
              />

              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                disabled={!editing}
                startIcon={<FaCamera />}
                color="secondary"
              >
                Photo
                <VisuallyHiddenInput
                  type="file"
                  accept="image/*"
                  onChange={handleNewAvatarPreview.onFileChange}
                  multiple={false}
                />
              </Button>
              <Typography
                marginLeft={1}
                variant="body2"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                {form.profile_picture
                  ? (form.profile_picture as File).name
                  : ""}
              </Typography>
            </Box>
            <TextField
              label="First Name"
              name="first_name"
              fullWidth
              value={form.first_name}
              onChange={handleInputChange}
              disabled={!editing}
              required
              sx={{ marginBottom: 3 }}
            />
            <TextField
              label="Last Name"
              name="last_name"
              fullWidth
              value={form.last_name}
              onChange={handleInputChange}
              disabled={!editing}
              required
              sx={{ marginBottom: 2 }}
            />

            <TextField
              label="Email"
              name="email"
              fullWidth
              value={form.email}
              onChange={handleInputChange}
              disabled={!editing}
              required
              sx={{ marginBottom: 2 }}
            />

            <TextField
              label="Phone Number"
              name="phone_number"
              fullWidth
              value={form.phone_number}
              onChange={handleInputChange}
              disabled={!editing}
              sx={{ marginBottom: 2 }}
            />
            <Divider sx={{ marginBottom: "0", marginTop: "1rem" }} />
            <Typography
              variant="body1"
              fontWeight={"600"}
              fontSize={"1rem"}
              marginY={2}
              gutterBottom
            >
              User Settings
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "start",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={form.email_notifications}
                    name="email_notifications"
                    onChange={(e) =>
                      handleNotificationToggle(
                        "email_notifications",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.push_notifications}
                    name="push_notifications"
                    onChange={(e) =>
                      handleNotificationToggle(
                        "push_notifications",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={<ThemeToggle />}
                name="theme"
                label="Theme"
              />
            </Box>
            <Divider sx={{ marginY: "1rem" }} />
          </Box>

          <Box
            component="div"
            width={{ xs: "100%", sm: "50%" }}
            id="profile-settings"
            sx={{
              padding: 2,
              backgroundColor: "background.paper",
              borderRadius: "4px",
            }}
          >
            <Box>
              <Typography
                variant="body1"
                fontWeight={"600"}
                fontSize={"1rem"}
                marginBottom={2}
                gutterBottom
              >
                Preferred Stores
              </Typography>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                  }}
                >
                  <AddPreferredStore
                    onStoreSelect={setSelectedStore}
                    onInputValueChange={setCurrentInputValue}
                    currentInputValue={currentInputValue}
                    selectedStore={selectedStore} // Pass the selected store
                  />
                  <IconButton
                    aria-label="add store"
                    onClick={handleAddStoreButtonClick}
                    size="large"
                    sx={{
                      border: "2px solid",
                      borderColor: "primary.main",
                      backgroundColor: "secondary.main",
                      borderEndEndRadius: "8px",
                      borderStartEndRadius: "8px",
                      borderEndStartRadius: "0",
                      borderStartStartRadius: "0",
                    }}
                  >
                    <FaPlus />
                  </IconButton>
                </Box>
                <Typography
                  variant="body2"
                  fontSize={"0.9rem"}
                  fontWeight={"600"}
                  marginTop={2}
                >
                  Your Preferred Stores
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 2,
                    flexWrap: "wrap",
                    border: "2px dashed",
                    borderColor: "secondary.dark",
                    paddingX: 4,
                    paddingY: 3,
                    marginBottom: 1,
                    marginTop: 1,
                    borderRadius: "15px",
                    // backgroundColor: "highlight.main",
                  }}
                >
                  {preferredStores.map((store) => (
                    <Chip
                      key={store.id}
                      label={`${store.name}, ${store.address}`}
                      onDelete={() => handleDeleteStore(store.id)}
                      color="secondary"
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            <Box>
              <Divider sx={{ marginBottom: "1rem", marginTop: "1rem" }} />
              <Typography
                variant="body1"
                fontWeight={"600"}
                fontSize={"1rem"}
                marginY={2}
                gutterBottom
              >
                Main Shopping Region
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="region-select-label">Region</InputLabel>
                <Select
                  labelId="region-select-label"
                  value={region || ""}
                  onChange={handleRegionChange}
                >
                  <MenuItem value={""}>None</MenuItem>
                  <MenuItem value={"North"}>North</MenuItem>
                  <MenuItem value={"South"}>South</MenuItem>
                  <MenuItem value={"Central"}>Central</MenuItem>
                  <MenuItem value={"East"}>East</MenuItem>
                  <MenuItem value={"West"}>West</MenuItem>
                  <MenuItem value={"Tobago"}>Tobago</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Divider sx={{ marginBottom: "1rem", marginTop: "2rem" }} />
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={
            snackbarMessage.includes("successfully") ? "success" : "error"
          } // Conditional severity
          variant="outlined"
          sx={{
            width: "100%",
            backgroundColor: "highlight.main",
            color: "text.primary",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;
