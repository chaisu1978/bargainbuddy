import { Snackbar, Alert, AlertColor } from "@mui/material";

export interface CustomSnackbarProps {
  open: boolean;
  message: string;
  severity: AlertColor; // "success" | "error" | "info" | "warning"
  onClose: () => void;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "center" | "left" | "right";
  };
}

/**
 * A reusable Snackbar+Alert component.
 */
export default function CustomSnackbar({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 3000,
  anchorOrigin = { vertical: "top", horizontal: "center" },
}: CustomSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={onClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
}
