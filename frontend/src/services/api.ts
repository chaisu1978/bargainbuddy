import apiClient from "./auth";

export interface PriceListing {
    id: number;
    price: string;
    date_added: string;
    product_name: string;
    product_brand?: string;
    product_amount?: string;
    store_name: string;
    store_address?: string;
    store_region: string;
    store_lat: number;
    store_lon: number;
  }

  export interface PaginatedResponse<T> {
    count: number; // Total number of items
    next: string | null; // URL for the next page
    previous: string | null; // URL for the previous page
    results: T[]; // Array of results
  }

  export const getSearchResults = async (
    query: string,
    region: string,
    ordering?: string,
    page?: number
  ): Promise<PaginatedResponse<PriceListing>> => {
    const params = new URLSearchParams();
    if (query) params.append("search", query);
    if (region) params.append("region", region);
    if (ordering) params.append("ordering", ordering);
    if (page) params.append("page", page.toString()); // Add pagination support

    const { data } = await apiClient.get<PaginatedResponse<PriceListing>>(
      `/price/price/?${params.toString()}`
    );
    return data;
  };


// Fetch recent price listings
export const getRecentPriceListings = async (
  region: string = "Everywhere"
): Promise<PriceListing[]> => {
  const { data } = await apiClient.get<PriceListing[]>(
    `/price/price/?recent=true&region=${region}`
  );
  return data;
};

// Fetch public token
export const getPublicToken = async (): Promise<void> => {
  try {
    await apiClient.post("/core/public-token/");
    console.log("Public token fetched successfully");
  } catch (error) {
    console.error("Error fetching public token", error);
  }
};
