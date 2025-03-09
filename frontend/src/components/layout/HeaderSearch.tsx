import React, { useState, useCallback, useRef } from "react";
import {
  Toolbar,
  Box,
  Container,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Button,
  ButtonGroup,
  SelectChangeEvent,
  CircularProgress,
  Autocomplete,
  TextField,
  Paper,
  PaperProps,
  useTheme,
  AutocompleteChangeReason, // <-- import for 'reason' type
} from "@mui/material";
import { FaSearch } from "react-icons/fa";
import { getSearchResults } from "../../services/api";
import { PriceListing } from "../../services/api";
import { debounce } from "../../utils/debounce";
import apiClient from "../../services/auth";

const CustomPaper = (props: PaperProps) => {
  const theme = useTheme();

  return (
    <Paper
      {...props}
      style={{
        backgroundColor: theme.palette.background.default,
      }}
    />
  );
};

interface HeaderSearchProps {
  onSearch: (
    results: PriceListing[],
    isLoading: boolean,
    query: string,
    region: string,
    ordering: string | undefined
  ) => void;
}

interface Store {
  id: number;
  name: string;
  address: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  amount: string;
}

interface History {
  id: number;
  query: string;
  timestamp: string;
}

interface Suggestions {
  stores: Store[];
  products: Product[];
  history: History[];
}

type SuggestionOption = {
  group: string;
  value: Store | Product | History;
};

const HeaderSearch: React.FC<HeaderSearchProps> = ({ onSearch }) => {
  const [region, setRegion] = useState("Everywhere");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({
    stores: [],
    products: [],
    history: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // -----------------------------
  // Debounced search function
  // -----------------------------
  const debouncedSearch = useCallback(
    debounce(
      async (
        query: string,
        searchRegion: string,
        sortParam: string | undefined
      ) => {
        if (!query.trim()) return; // Don't search if query is empty

        setLoading(true);
        onSearch([], true, query, searchRegion, sortParam);

        try {
          const data = await getSearchResults(query, searchRegion, sortParam);
          onSearch(data.results, false, query, searchRegion, sortParam);
        } catch (error) {
          console.error("Error performing search", error);
          onSearch([], false, query, searchRegion, sortParam);
        } finally {
          setLoading(false);
        }
      },
      300
    ),
    [onSearch]
  );

  // -----------------------------
  // Debounced suggestions fetch
  // -----------------------------
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSuggestions({ stores: [], products: [], history: [] });
        return;
      }

      try {
        const { data } = await apiClient.get<Suggestions>(
          "/search-suggest/search-suggest/",
          {
            params: {
              query,
              include_history: true,
              include_products: true,
              include_stores: true,
            },
          }
        );

        setSuggestions({
          history: data.history || [],
          products: data.products || [],
          stores: data.stores || [],
        });
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 300),
    []
  );

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleSearch = (overrideQuery?: string) => {
    const activeQuery = overrideQuery ?? searchQuery; // fallback to state
    const sortParam = sortField
      ? `${sortOrder === "desc" ? "-" : ""}${sortField}`
      : undefined;

    debouncedSearch(activeQuery, region, sortParam);
  };

  const handleRegionChange = (e: SelectChangeEvent<string>) => {
    setRegion(e.target.value);
    if (searchQuery) {
      const sortParam = sortField
        ? `${sortOrder === "desc" ? "-" : ""}${sortField}`
        : undefined;
      debouncedSearch(searchQuery, e.target.value, sortParam);
    }
  };

  const handleSort = (field: string) => {
    let newSortOrder: "asc" | "desc" = "asc";

    if (sortField === field) {
      newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    }

    setSortField(field);
    setSortOrder(newSortOrder);

    if (searchQuery) {
      const sortParam = `${newSortOrder === "desc" ? "-" : ""}${field}`;
      debouncedSearch(searchQuery, region, sortParam);
    }
  };

  // -----------------------------
  // Input / Suggestion logic
  // -----------------------------
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      fetchSuggestions(value);
    } else {
      // Clear out suggestions if the query is blank
      setSuggestions({ stores: [], products: [], history: [] });
    }
  };

  // 1) We modify the signature so we can check the event type (mouse vs keyboard).
  const handleOptionSelect = (
    event: React.SyntheticEvent<Element, Event>,
    option: string | SuggestionOption | null,
    reason: AutocompleteChangeReason
  ) => {
    let newQuery = "";

    if (typeof option === "string") {
      newQuery = option;
    } else if (option) {
      if (option.group === "history") {
        newQuery = (option.value as History).query;
      } else if (option.group === "stores") {
        const store = option.value as Store;
        newQuery = `${store.name} ${store.address}`;
      } else {
        const product = option.value as Product;
        newQuery = `${product.brand} ${product.name} ${product.amount}`;
      }
    }

    setSearchQuery(newQuery);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    // If they clicked with the mouse, trigger immediate search with the new text
    if (reason === "selectOption" && event.type === "click") {
      handleSearch(newQuery); // Pass newQuery so the search is correct
    }
  };

  // Only search if Enter wasn't used for an Autocomplete selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const keyboardEvent = e as React.KeyboardEvent & {
      defaultMuiPrevented?: boolean;
    };
    if (keyboardEvent.key === "Enter" && !keyboardEvent.defaultMuiPrevented) {
      e.preventDefault();
      handleSearch();
      // Force the text field to lose focus, which closes the popup
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <Toolbar
      sx={{
        backgroundColor: "background.default",
        justifyContent: "center",
        flexDirection: "column",
        paddingY: 1,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            border: 3,
            borderColor: "searchbox.main",
            borderRadius: 7,
            overflow: "hidden",
            backgroundColor: "default",
            width: "100%",
            marginBottom: 0,
            marginTop: 1,
          }}
        >
          <Autocomplete
            /* 
              Let MUI open/close automatically. 
              The dropdown closes by default after selection.
            */
            freeSolo
            filterOptions={(options) => options} // Disable built-in text filtering
            groupBy={(option) =>
              (option as SuggestionOption).group.toUpperCase()
            }
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              if (option.group === "stores") {
                const store = option.value as Store;
                return `${store.name}, ${store.address}`;
              }
              if (option.group === "products") {
                const product = option.value as Product;
                return `${product.brand} ${product.name} ${product.amount}`;
              }
              const history = option.value as History;
              return history.query;
            }}
            options={Object.entries(suggestions).flatMap(([group, items]) =>
              (items as (Store | Product | History)[]).map((item) => ({
                group,
                value: item,
              }))
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              const group = option.group;
              const val = option.value;
              return (
                <li key={key} {...otherProps}>
                  <Box>
                    {group === "history" && (
                      <Typography variant="body1">
                        {(val as History).query}
                      </Typography>
                    )}
                    {group === "products" && (
                      <>
                        <Typography variant="body1">
                          {(val as Product).brand} {(val as Product).name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {(val as Product).amount}
                        </Typography>
                      </>
                    )}
                    {group === "stores" && (
                      <>
                        <Typography variant="body1">
                          {(val as Store).name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {(val as Store).address}
                        </Typography>
                      </>
                    )}
                  </Box>
                </li>
              );
            }}
            value={searchQuery}
            // (A) When the user types, fetch suggestions
            onInputChange={(_, value) => handleInputChange(value)}
            // (B) When user selects with mouse or keyboard
            onChange={(event, value, reason) =>
              handleOptionSelect(event, value, reason)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={inputRef}
                placeholder="Search"
                onKeyDown={handleKeyDown}
                sx={{
                  flex: 3,
                  fontWeight: "bold", // Adjust font weight
                  boxShadow: "none",
                  borderColor: "none",
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-root.Mui-notchedOutline":
                    {
                      borderColor: "transparent",
                    },
                  "& .MuiInputBase-root": {
                    paddingY: "2px!important",
                  },
                  "& .MuiInputBase-input": {
                    color: "searchbox.main", // Use the same color as Select
                    fontWeight: "bold", // Match font weight with Select
                    fontSize: "1rem", // Adjust font size as needed
                  },
                }}
              />
            )}
            slots={{
              paper: CustomPaper,
            }}
            slotProps={{
              listbox: {
                style: {
                  minHeight: "60vh",
                  maxHeight: "70vh",
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderColor: "transparent",
                boxShadow: "none",
              },
              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "transparent",
                },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "transparent",
                },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "& .MuiAutocomplete-inputRoot": {
                paddingY: "2px!important",
                borderColor: "transparent",
                boxShadow: "none",
              },
              "& .MuiAutocomplete-endAdornment": {
                display: "none",
              },
              boxShadow: "none",
              flex: 3,
            }}
          />

          <Select
            value={region}
            onChange={handleRegionChange}
            sx={{
              flex: 1,
              borderLeft: 2,
              borderRight: 2,
              fontWeight: "bold",
              color: "searchbox.main",
              borderColor: "searchbox.main",
              borderRadius: 0,
              display: {
                xs: "none",
                sm: "block",
              },
              "& .MuiSelect-icon": {
                color: "text.brandc",
              },
              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "transparent",
                },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "transparent",
                },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            {[
              "Everywhere",
              "North",
              "South",
              "Central",
              "East",
              "West",
              "Tobago",
            ].map((location) => (
              <MenuItem key={location} value={location}>
                {location}
              </MenuItem>
            ))}
          </Select>

          <IconButton
            type="button"
            onClick={() => handleSearch()}
            sx={{
              padding: 1,
              marginLeft: 2,
              marginRight: 2,
              backgroundColor: "searchbox.main",
              "&:hover": {
                backgroundColor: "searchbox.dark",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} style={{ color: "white" }} />
            ) : (
              <FaSearch style={{ color: "white" }} />
            )}
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 3,
          }}
        >
          <Typography variant="body1" sx={{ marginRight: 2 }}>
            Sort:
          </Typography>
          <ButtonGroup variant="text" color="primary" size="small">
            <Button
              onClick={() => handleSort("price")}
              variant={sortField === "price" ? "contained" : "outlined"}
            >
              Price {sortField === "price" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button
              onClick={() => handleSort("date_added")}
              variant={sortField === "date_added" ? "contained" : "outlined"}
            >
              Date{" "}
              {sortField === "date_added" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button
              onClick={() => handleSort("store__name")}
              variant={sortField === "store__name" ? "contained" : "outlined"}
            >
              Store{" "}
              {sortField === "store__name" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button
              onClick={() => {
                setSortField(null);
                setSortOrder(null);
                debouncedSearch(searchQuery, region, undefined);
              }}
              variant={sortField === null ? "contained" : "outlined"}
              color="inherit"
            >
              Reset
            </Button>
          </ButtonGroup>
        </Box>
      </Container>
    </Toolbar>
  );
};

export default HeaderSearch;
