import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getUserDetails } from "../services/auth";

interface Store {
  id: number;
  name: string;
  address: string;
}

interface Region {
  region: string;
}

interface User {
  email: string | null;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
  preferred_stores?: Store[];
  preferred_region?: Region;
  email_notifications?: boolean;
  push_notifications?: boolean;
  theme_mode?: string;
  is_superuser?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem("accessToken"), // Persist auth state
  user: null,
};

export const fetchUserData = createAsyncThunk("auth/fetchUserData", async () => {
  return await getUserDetails();
});


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<User>) {
      state.isAuthenticated = true;
      state.user = action.payload; // Set the full user object
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      localStorage.clear(); // Clear tokens from localStorage
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserData.fulfilled, (state, action) => {
      state.user = action.payload; // Populate the user state when the thunk is fulfilled
    });
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;

