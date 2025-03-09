import React, { useState } from "react";
import { Box, Button, Collapse, TextField } from "@mui/material";
import { FaPlusCircle } from "react-icons/fa";

interface NewShoppingListProps {
  onAddNewList: (name: string) => Promise<void>; // Function to handle adding a new shopping list
  isCreating?: boolean; // Loading state for the creation process
  buttonAlignment?: "flex-start" | "center" | "flex-end"; // Optional alignment prop
}

const NewShoppingList: React.FC<NewShoppingListProps> = ({
  onAddNewList,
  isCreating = false,
  buttonAlignment = "center", // Default alignment
}) => {
  const [showTextField, setShowTextField] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState("");

  const handleNewButtonClick = () => {
    setShowTextField((prev) => !prev);
    setError("");
    setNewListName("");
  };

  const handleAddNewList = async () => {
    if (!newListName.trim()) {
      setError("Shopping list name is required.");
      return;
    }

    try {
      setError("");
      await onAddNewList(newListName.trim()); // Pass the trimmed name
      setNewListName("");
      setShowTextField(false);
    } catch (err) {
      setError("Failed to create shopping list. Please try again.");
    }
  };

  return (
    <>
      {/* Button to show/hide the input field */}
      <Button
        name="newlist"
        fullWidth
        variant="contained"
        size="small"
        sx={{
          mt: 0,
          pl: 1,
          backgroundColor: "background.paper",
          color: "text.primary",
          border: "2px solid #c5d631",
          // align the button text left
          justifyContent: buttonAlignment, // Use the prop here
        }}
        onClick={handleNewButtonClick}
      >
        <FaPlusCircle style={{ marginRight: "7px" }} />
        New Shopping List
      </Button>

      {/* Input field and Add button */}
      <Collapse in={showTextField}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: 1,
          }}
        >
          <TextField
            id="new-shopping-list"
            label="Shopping List Name"
            color="primary"
            fullWidth
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            error={!!error}
            helperText={error}
            size="small"
            sx={{
              fontSize: "1rem",
            }}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{
              ml: 2,
              height: "38px",
            }}
            onClick={handleAddNewList}
            disabled={isCreating}
          >
            {isCreating ? "Adding..." : "Add"}
          </Button>
        </Box>
      </Collapse>
    </>
  );
};

export default NewShoppingList;
