import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

const UsernamePrompt = () => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (!stored) {
      setOpen(true);
    }
  }, []);

  const handleSave = () => {
    if (username.trim()) {
      localStorage.setItem("username", username.trim());
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} disableEscapeKeyDown>
      <DialogTitle>Enter Your UserName</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSave()}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} disabled={!username.trim()}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UsernamePrompt;