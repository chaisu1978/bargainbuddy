import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";

import { FaUpload, FaTrash } from "react-icons/fa";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";

import apiClient from "../../services/auth"; // or wherever your axios instance lives
import CustomSnackbar from "./CustomSnackbar";

interface ImportHistory {
  id: number;
  file_name: string;
  date_imported: string;
  success: boolean;
  message: string;
  imported_by?: {
    id: number;
    email: string;
  };
}

export default function MTIDataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importDate, setImportDate] = useState<Date | null>(new Date());
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [loading, setLoading] = useState(true); // ✅ Fetching state
  const [importing, setImporting] = useState(false); // ✅ Importing state
  const [undoing, setUndoing] = useState(false); // ✅ Undoing state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "info" | "error" | "success" | "warning",
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    recordId: 0,
    dateImported: "",
  });

  // ✅ Check screen size
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  // Fetch existing import logs on mount
  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get("/webmin/pricelistimporthistory/");
      setImportHistory(resp.data.results || []);
    } catch (error) {
      console.error("Error fetching history", error);
      setImportHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDateChange = (value: Date | null) => {
    setImportDate(value);
  };

  const handleImport = async () => {
    if (!file) {
      setSnackbar({
        open: true,
        message: "Please select a file to import.",
        severity: "warning",
      });
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (importDate) {
        formData.append("date_added", importDate.toISOString());
      }

      const resp = await apiClient.post("/webmin/upload-price-list/", formData);
      setSnackbar({
        open: true,
        message: resp.data?.message || "Import initiated successfully",
        severity: "success",
      });

      fetchImportHistory();
      setFile(null);
    } catch (err: any) {
      console.error("Import error:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to import file",
        severity: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleOpenDeleteDialog = (id: number, dateImported: string) => {
    setDeleteDialog({ open: true, recordId: id, dateImported });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, recordId: 0, dateImported: "" });
  };

  const handleConfirmDelete = async () => {
    setUndoing(true);
    try {
      await apiClient.delete(
        `/webmin/undo-mti-import/${deleteDialog.recordId}/`
      );

      setSnackbar({
        open: true,
        message: "Import record and associated prices removed.",
        severity: "info",
      });
      fetchImportHistory();
    } catch (err) {
      console.error("Undo import error:", err);
      setSnackbar({
        open: true,
        message: "Failed to undo import.",
        severity: "error",
      });
    } finally {
      setUndoing(false);
      handleCloseDeleteDialog();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Title */}
      <Typography variant="h5" fontWeight="bold">
        MTI Data Import
      </Typography>

      {/* Card for uploading new file */}
      <Card>
        <CardHeader title="Upload New MTI File" />
        <CardContent>
          <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              component="label"
              startIcon={<FaUpload />}
              disabled={importing}
            >
              Select File
              <input
                hidden
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
              />
            </Button>
            {file && <Typography>{file.name}</Typography>}

            {/* Correct DatePicker */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DesktopDatePicker
                value={importDate}
                onChange={handleDateChange}
              />
            </LocalizationProvider>

            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "Import"
              )}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Table of previous imports */}
      <Card>
        <CardHeader title="Previous Imports" />
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : importHistory.length === 0 ? (
            <Typography>No import history found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {!isSmallScreen && <TableCell>File Name</TableCell>}
                    <TableCell>Date Imported</TableCell>
                    {!isSmallScreen && <TableCell>Success?</TableCell>}
                    {!isSmallScreen && <TableCell>Message</TableCell>}
                    {!isSmallScreen && <TableCell>Imported By</TableCell>}
                    <TableCell align="center">Undo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importHistory.map((record) => (
                    <TableRow key={record.id}>
                      {!isSmallScreen && (
                        <TableCell>{record.file_name}</TableCell>
                      )}
                      <TableCell>
                        {format(
                          new Date(record.date_imported),
                          "MMM dd yyyy, hh:mma"
                        )}
                      </TableCell>
                      {!isSmallScreen && (
                        <TableCell>{record.success ? "Yes" : "No"}</TableCell>
                      )}
                      {!isSmallScreen && (
                        <TableCell>{record.message}</TableCell>
                      )}
                      {!isSmallScreen && (
                        <TableCell>
                          {record.imported_by
                            ? record.imported_by.email
                            : "Unknown"}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() =>
                            handleOpenDeleteDialog(
                              record.id,
                              record.date_imported
                            )
                          }
                          disabled={undoing}
                        >
                          {undoing ? (
                            <CircularProgress size={18} />
                          ) : (
                            <FaTrash />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete/Undo Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Undo Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove all price listings created by this import (date:{" "}
            {deleteDialog.dateImported})?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Undo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      />
    </Box>
  );
}
