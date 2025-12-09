import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Trophy } from "lucide-react";
import FifaFlag from "../../components/FifaFlag";
import { fifaTheme } from "../../constants/fifaTheme";
import { apiPost } from "../../api/fifaApi";
import { useNavigate } from "react-router-dom";

export default function FifaWinner() {
  const navigate = useNavigate();
  const state = JSON.parse(sessionStorage.getItem("fifa_state") || "{}");
  const winner = state?.final?.winner;

  async function saveFinal() {
    try {
      const res = await apiPost("/api/fifa2026/save_final", {
        user_id: localStorage.getItem("username") || "guest",
        state,
      });
      if (res?.ipfs_cid) {
        window.open(`https://gateway.pinata.cloud/ipfs/${res.ipfs_cid}`, "_blank");
      } else {
        alert("Saved, but no IPFS link returned.");
      }
    } catch (e) {
      alert("Failed to save final.");
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 6, background: fifaTheme.background.base }}>
      <Box sx={{ textAlign: "center" }}>
        <Trophy size={120} style={{ color: fifaTheme.gold }} />
        <Typography variant="h2" sx={{ color: "white", fontWeight: 900 }}>Champion</Typography>

        {winner ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center", mt: 4, bgcolor: "rgba(255,255,255,0.06)", p: 3, borderRadius: 3 }}>
            <FifaFlag team={winner} size={64} />
            <Typography sx={{ color: "white", fontSize: 28, fontWeight: 900 }}>{winner.toUpperCase()}</Typography>
          </Box>
        ) : (
          <Typography sx={{ color: "white", mt: 4 }}>No winner decided yet.</Typography>
        )}

        <Box sx={{ display: "flex", gap: 3, justifyContent: "center", mt: 6 }}>
          <Button variant="contained" onClick={saveFinal} sx={{ background: "#16a34a", color: "white" }}>Save & Download PDF</Button>
          <Button variant="outlined" onClick={() => { sessionStorage.removeItem("fifa_state"); sessionStorage.removeItem("fifa_playoffs"); navigate("/"); }} sx={{ color: "white", borderColor: "rgba(255,255,255,0.2)" }}>Reset</Button>
        </Box>
      </Box>
    </Box>
  );
}
