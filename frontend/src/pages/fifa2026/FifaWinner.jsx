import React from "react";
import { Box, Button, Typography, Paper, Container, Fade, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Download, RefreshCw, Trophy } from "lucide-react";
import FifaFlag from "../../components/FifaFlag";
import { fifaTheme } from "../../constants/fifaTheme";
import { API_BASE } from "../../api/fifaApi";

export default function FifaWinner() {
  const navigate = useNavigate();
  const state = JSON.parse(sessionStorage.getItem("fifa_state") || "{}");

  const champion = state.final?.winner || "—";
  const runnerUp = state.final?.teamA === champion ? state.final?.teamB : state.final?.teamA || "—";
  const third = state.third_place?.winner || "—";

  async function saveFinal() {
    try {
      if (!state?.final?.winner) return;
      const url = `${API_BASE}/api/fifa2026/save_final`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: localStorage.getItem("username") || "guest", state }),
      });
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "FIFA_World_Cup_2026_Predictions.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base, display: "flex", alignItems: "center", py: 10 }}>
      <Container maxWidth="md">
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: "center" }}>
            <Trophy size={80} color={fifaTheme.gold} style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.5))" }} />
            <Typography variant="h2" sx={{ fontWeight: 900, color: "#fff", mt: 2, mb: 1, textTransform: "uppercase", letterSpacing: 2 }}>
              Final Standings
            </Typography>
            <Typography sx={{ color: fifaTheme.text.secondary, mb: 8, fontWeight: 700, letterSpacing: 1 }}>
              FIFA WORLD CUP 2026 ★ PREDICTION COMPLETE
            </Typography>

            {/* Podium */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="flex-end" justifyContent="center">
              
              {/* Runner Up */}
              <PodiumPlace 
                label="Runner Up" 
                team={runnerUp} 
                height={220} 
                color="rgba(192, 192, 192, 0.2)" 
                borderColor="rgba(192, 192, 192, 0.4)" 
                order={2}
              />

              {/* Champion */}
              <PodiumPlace 
                label="Champion" 
                team={champion} 
                height={300} 
                color="rgba(255, 215, 0, 0.25)" 
                borderColor="rgba(255, 215, 0, 0.5)" 
                isWinner
                order={1}
              />

              {/* Third Place */}
              <PodiumPlace 
                label="Third Place" 
                team={third} 
                height={180} 
                color="rgba(205, 127, 50, 0.2)" 
                borderColor="rgba(205, 127, 50, 0.4)" 
                order={3}
              />

            </Stack>

            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 10 }}>
              <Button
                variant="contained"
                startIcon={<Download size={20} />}
                onClick={saveFinal}
                sx={{
                  px: 5, py: 2, borderRadius: 10, fontWeight: 900, fontSize: 14,
                  background: fifaTheme.cyanGradient,
                  boxShadow: `0 0 30px rgba(0, 180, 255, 0.3)`,
                  "&:hover": { transform: "translateY(-4px)" }
                }}
              >
                Download Results
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshCw size={20} />}
                onClick={() => { sessionStorage.clear(); navigate("/"); }}
                sx={{
                  px: 5, py: 2, borderRadius: 10, fontWeight: 800, fontSize: 14,
                  color: "#fff", borderColor: "rgba(255,255,255,0.2)",
                  "&:hover": { background: "rgba(255,255,255,0.05)", borderColor: "#fff" }
                }}
              >
                Start New
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

function PodiumPlace({ label, team, height, color, borderColor, isWinner = false, order }) {
  return (
    <Box sx={{ order: { xs: order, sm: order === 1 ? 2 : order === 2 ? 1 : 3 }, width: { xs: "100%", sm: 240 } }}>
      <Paper
        elevation={0}
        sx={{
          height,
          p: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          background: color,
          backdropFilter: "blur(10px)",
          border: `1px solid ${borderColor}`,
          borderRadius: "24px 24px 4px 4px",
          position: "relative",
          transition: "transform 0.3s",
          "&:hover": { transform: "scale(1.02)" }
        }}
      >
        {isWinner && (
           <Box sx={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 40, height: 40, background: fifaTheme.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${fifaTheme.gold}` }}>
             <Trophy size={20} color="#000" />
           </Box>
        )}
        <Box sx={{ width: isWinner ? 80 : 64, height: isWinner ? 60 : 48, borderRadius: 2, overflow: "hidden", mb: 2, boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
          <FifaFlag team={team} />
        </Box>
        <Typography sx={{ fontWeight: 900, color: "#fff", fontSize: isWinner ? 24 : 18, mb: 1 }}>{team}</Typography>
        <Typography sx={{ color: isWinner ? fifaTheme.gold : fifaTheme.text.muted, fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>
          {label}
        </Typography>
      </Paper>
    </Box>
  );
}
