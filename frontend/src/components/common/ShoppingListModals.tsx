import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";

/** Props for Edit Modal */
interface EditModalProps {
  open: boolean;
  onClose: () => void;
  listToEdit: { name: string; description: string } | null;
  onSave: () => void;
  onChange: (field: "name" | "description", value: string) => void;
}

/** Edit Shopping List Modal */
export const EditShoppingListModal: React.FC<EditModalProps> = ({
  open,
  onClose,
  listToEdit,
  onSave,
  onChange,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Edit Shopping List</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Name"
        fullWidth
        value={listToEdit?.name || ""}
        onChange={(e) => onChange("name", e.target.value)}
        // shadow outline
      />
      <TextField
        margin="dense"
        label="Description"
        fullWidth
        value={listToEdit?.description || ""}
        onChange={(e) => onChange("description", e.target.value)}
      />
    </DialogContent>
    <DialogActions>
      <Button
        onClick={onClose}
        type="button"
        variant="outlined"
        color="inherit"
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        type="button"
        variant="contained"
        color="primary"
      >
        Save
      </Button>
    </DialogActions>
  </Dialog>
);

/** Props for Confirm Delete Modal */
interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

/** Confirm Delete Modal */
export const ConfirmDeleteModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{description}</Typography>
    </DialogContent>
    <DialogActions>
      <Button
        onClick={onClose}
        type="button"
        variant="outlined"
        color="inherit"
      >
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);
