import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Slide,
  useScrollTrigger,
  Toolbar,
  Typography,
  Fab,
  Zoom,
  Skeleton,
} from "@mui/material";
import { FaArrowUp } from "react-icons/fa";
import HeaderSearch from "../layout/HeaderSearch";
import PriceCard from "../common/PriceCard";
import PriceDetailsModal from "../common/PriceDetailsModal";
import { PriceListing, getSearchResults } from "../../services/api";

interface Props {
  window?: () => Window;
  children?: React.ReactElement;
}

function HideOnScroll(props: Props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children ?? <div />}
    </Slide>
  );
}

function ScrollTop(props: Props) {
  const { window } = props;
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = () => {
    const anchor = (window ? window().document : document).querySelector(
      "#back-to-top-anchor"
    );

    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{
          position: "fixed",
          top: 92,
          left: 10,
          zIndex: 1101,
        }}
      >
        <Fab
          size="small"
          aria-label="scroll back to top"
          sx={{
            backgroundColor: "tertiary.main",
            "&:hover": {
              backgroundColor: "tertiary.main",
            },
            "&:active": {
              backgroundColor: "tertiary.main",
            },
          }}
        >
          <FaArrowUp />
        </Fab>
      </Box>
    </Zoom>
  );
}
const gap = 18;
const renderSkeletons = (count: number) => {
  const skeletonArray = Array.from({ length: count });
  return skeletonArray.map((_, index) => (
    <Box
      key={index}
      sx={{
        flexBasis: {
          xs: `calc(50% - ${gap}px)`, // Matches the card layout
          sm: `calc(50% - ${gap}px)`,
          md: `calc(33.33% - ${gap}px)`,
          lg: `calc(25% - ${gap}px)`,
        },

        flexGrow: 1, // Allow wrapping within the grid
        minWidth: 140,
        marginBottom: `${16}px`, // Consistent spacing with cards
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Image Section */}
      <Skeleton
        variant="rectangular"
        animation="wave"
        height={100} // Mimic card image height
        width="100%" // Full width of the skeleton
        sx={{
          borderRadius: "4px 4px 0 0", // Top corners rounded
        }}
      />
      {/* Text Section */}
      <Box sx={{ padding: 0, width: "100%" }}>
        <Skeleton
          variant="text"
          animation="wave"
          height={25} // Title placeholder
        />
        <Skeleton
          variant="text"
          animation="wave"
          height={25} // Subtitle placeholder
        />
        <Skeleton
          variant="text"
          animation="wave"
          height={25} // Subtitle placeholder
        />{" "}
        <Skeleton
          variant="text"
          animation="wave"
          height={25} // Subtitle placeholder
        />
      </Box>
      {/* Price Section */}
      <Skeleton
        variant="rectangular"
        animation="wave"
        height={50} // Mimic card price height
        width="100%"
        sx={{
          borderRadius: "0 0 4px 4px", // Bottom corners rounded
        }}
      />
    </Box>
  ));
};

const HomePage = (props: Props) => {
  const [pagedListings, setPagedListings] = useState<PriceListing[][]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedListing, setSelectedListing] = useState<PriceListing | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Add the new state declarations for search parameters here
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRegion, setSearchRegion] = useState("Everywhere");
  const [searchOrdering, setSearchOrdering] = useState<
    string | null | undefined
  >(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const handleOpenModal = (listing: PriceListing) => {
    setSelectedListing(listing);
    setModalOpen(true);
    navigate(location.pathname, { state: { modalOpen: true } }); // Update history
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedListing(null);
    navigate(location.pathname, { state: { modalOpen: false } }); // Update history
  };
  useEffect(() => {
    if (location.state?.modalOpen) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
  }, [location.state]);

  // Fetch listings based on the page number
  const fetchListings = useCallback(
    async (pageNumber: number) => {
      try {
        setLoading(true);

        const { results, next } = await getSearchResults(
          searchQuery,
          searchRegion,
          searchOrdering ?? undefined,
          pageNumber
        );

        setPagedListings((prevPagedListings) =>
          pageNumber === 1 ? [results] : [...prevPagedListings, results]
        );

        setHasNextPage(Boolean(next));
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, searchRegion, searchOrdering]
  );

  useEffect(() => {
    fetchListings(page);
  }, [page, fetchListings]);

  // Intersection observer to trigger lazy loading
  useEffect(() => {
    if (loading || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { rootMargin: "200px" }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [loading, hasNextPage]);

  // Flatten listings with advertisements added after each NON-empty page:
  const totalItemCount = pagedListings.reduce(
    (acc, page) => acc + page.length,
    0
  );

  const combinedListings =
    totalItemCount === 0
      ? []
      : pagedListings.flatMap((page) =>
          page.length > 0 ? [...page, "ad"] : []
        );
  return (
    <React.Fragment>
      <Toolbar
        id="back-to-top-anchor"
        disableGutters
        sx={{
          height: "1px !important",
          minHeight: "1px !important",
          padding: "0 !important",
          margin: "0 !important",
          display: "block !important",
        }}
      />
      <HideOnScroll {...props}>
        <AppBar position="sticky">
          <HeaderSearch
            onSearch={(results, isLoading, query, region, ordering) => {
              if (isLoading) {
                setPagedListings([]); // Clear listings
                setPage(1); // Reset to first page
                setSearchQuery(query); // Update query
                setSearchRegion(region); // Update region
                setSearchOrdering(ordering); // Update ordering
                setHasNextPage(true); // Reset pagination
              } else {
                setPagedListings([results]); // Store first batch of results as page 1
              }
              setLoading(isLoading);
            }}
          />
        </AppBar>
      </HideOnScroll>
      <Box
        component="main"
        sx={{
          flex: 1,
          padding: 1,
          backgroundColor: "background.default",
          marginTop: "10px",
          minHeight: "85vh",
        }}
      >
        <Container>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: `${gap}px`,
            }}
          >
            {/* Show "No results found" if there are no listings and not loading */}
            {!loading && combinedListings.length === 0 ? (
              <Typography
                variant="h6"
                sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}
              >
                No results found for "{searchQuery.trim() || "your search"}"
              </Typography>
            ) : (
              combinedListings.map((item, index) =>
                item === "ad" ? (
                  // Render Advertisement Placeholder
                  <Box
                    key={`ad-${index}`}
                    sx={{
                      flexBasis: {
                        xs: `calc(100% - ${gap}px)`, // Full width for ads
                        sm: `calc(100% - ${gap}px)`,
                        md: `calc(100% - ${gap}px)`,
                        lg: `calc(100% - ${gap}px)`,
                      },
                      marginY: 4,
                      textAlign: "center",
                      padding: 2,
                      backgroundColor: "#f5f5f5",
                      border: "1px dashed #ccc",
                    }}
                  >
                    <Typography variant="subtitle1">
                      Advertisement Placeholder
                    </Typography>
                  </Box>
                ) : (
                  // Render Price Card
                  <Box
                    key={`listing-${(item as PriceListing).id}-${index}`}
                    sx={{
                      flexBasis: {
                        xs: `calc(50% - ${gap}px)`,
                        sm: `calc(50% - ${gap}px)`,
                        md: `calc(33.33% - ${gap}px)`,
                        lg: `calc(25% - ${gap}px)`,
                      },
                      minWidth: 140,
                    }}
                  >
                    <PriceCard
                      listing={item as PriceListing}
                      onClick={() => handleOpenModal(item as PriceListing)}
                    />
                  </Box>
                )
              )
            )}
          </Box>

          {/* Intersection Observer Target */}
          {hasNextPage && (
            <Box
              ref={observerRef}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: `${gap}px`,
                marginTop: 2, // Space above skeletons
                marginBottom: 10, // Add scroll space below advertisement and skeletons
                paddingBottom: 8, // Additional padding for visual clarity
              }}
            >
              {loading && renderSkeletons(12)}{" "}
              {/* Render skeletons for lazy load */}
            </Box>
          )}
        </Container>
      </Box>
      <ScrollTop {...props} />
      <PriceDetailsModal
        open={modalOpen}
        onClose={handleCloseModal}
        listing={selectedListing}
        showAddToShoppingListButton={true}
      />
    </React.Fragment>
  );
};

export default HomePage;
