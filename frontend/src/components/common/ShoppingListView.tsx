import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";

interface ShoppingList {
  id: number;
  name: string;
  description: string;
  last_updated: string;
}

interface ShoppingListViewProps {
  shoppingLists: ShoppingList[];
  loadingLists: boolean;
  selectedList: ShoppingList | null;
  onSelectList: (list: ShoppingList) => void;
  onEditList: (list: ShoppingList) => void;
  onDeleteList: (list: ShoppingList) => void;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  shoppingLists,
  loadingLists,
  selectedList,
  onSelectList,
  onEditList,
  onDeleteList,
}) => {
  return (
    <Box sx={{ flex: 1, overflowY: "auto", padding: 1 }}>
      {loadingLists ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress />
        </Box>
      ) : shoppingLists.length === 0 ? (
        <Typography sx={{ textAlign: "center", mt: 2 }}>
          No shopping lists found.
        </Typography>
      ) : (
        <List sx={{ padding: 0 }}>
          {shoppingLists.map((list) => (
            <ListItem
              key={list.id}
              sx={{
                borderTop: "1px solid #ddd",
                paddingX: 1,
                position: "relative",
                backgroundColor:
                  selectedList?.id === list.id ? "highlight.main" : "inherit",
                "&:hover": { backgroundColor: "highlight.main" },
                cursor: "pointer",
              }}
              onClick={() => onSelectList(list)}
            >
              <ListItemText
                primary={list.name}
                secondary={list.description}
                primaryTypographyProps={{
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  fontWeight: "600",
                }}
                sx={{ paddingRight: "50px" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: "10px",
                  right: "0",
                  display: "flex",
                  gap: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditList(list);
                  }}
                  sx={{ fontSize: "1rem" }}
                >
                  <FaEdit />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteList(list);
                  }}
                  sx={{ fontSize: "1rem" }}
                >
                  <FaTrash />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ShoppingListView;
