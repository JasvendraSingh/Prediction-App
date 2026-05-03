import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FifaFlag from "../../components/FifaFlag";
import { fifaTheme } from "../../constants/fifaTheme";
import { API_BASE } from "../../api/fifaApi";

/* ---------- GLASS UTILS ---------- */
const glass = (opacity = 0.28, glow = "255,255,255") => ({
  background: `linear-gradient(
    180deg,
    rgba(255,255,255,${opacity}),
    rgba(255,255,255,0.04)
  )`,
  backdropFilter: "blur(12px)",
  borderRadius: 3,
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: `
    0 0 16px rgba(${glow},0.28),
    0 0 32px rgba(${glow},0.18)
  `,
});

export default function FifaWinner() {
  const navigate = useNavigate();
  const state = JSON.parse(sessionStorage.getItem("fifa_state") || "{}");

  const champion = state.final?.winner || "—";
  const runnerUp =
    state.final?.teamA === champion
      ? state.final?.teamB
      : state.final?.teamA || "—";
  const third = state.third_place?.winner || "—";

  /* ---------- PDF DOWNLOAD ---------- */
  async function saveFinal() {
    try {
      if (!state?.final?.winner) {
        alert("Final winner not decided yet.");
        return;
      }

      const url = `${API_BASE}/api/fifa2026/save_final`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: localStorage.getItem("username") || "guest",
          state,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "FIFA_World_Cup_Results.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF. Check console for details.");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: fifaTheme.background.base,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 980 }}>
        {/* TITLE */}
        <Typography
          sx={{
            textAlign: "center",
            color: fifaTheme.gold,
            fontWeight: 900,
            fontSize: 48,
            mb: 3,
            textShadow: "0 0 12px rgba(255,215,0,0.45)",
          }}
        >
          FIFA World Cup Results
        </Typography>

        {/* CHAMPION */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ ...glass(0.38, "255,215,0"), p: 2.5 }}>
            <Typography sx={{ color: fifaTheme.gold, fontWeight: 800, fontSize: 14 }}>
              CHAMPION
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
              <FifaFlag team={champion} size={48} />
              <Typography sx={{ color: "white", fontSize: 22, fontWeight: 900 }}>
                {champion}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* RUNNER-UP & THIRD */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box sx={{ ...glass(0.25, "192,192,192"), p: 2 }}>
            <Typography sx={{ color: "#e5e7eb", fontWeight: 700, fontSize: 13 }}>
              RUNNER UP
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
              <FifaFlag team={runnerUp} size={36} />
              <Typography sx={{ color: "white", fontWeight: 700 }}>
                {runnerUp}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ ...glass(0.25, "205,127,50"), p: 2 }}>
            <Typography sx={{ color: "#fcd34d", fontWeight: 700, fontSize: 13 }}>
              THIRD PLACE
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
              <FifaFlag team={third} size={36} />
              <Typography sx={{ color: "white", fontWeight: 700 }}>
                {third}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ACTIONS */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            onClick={saveFinal}
            sx={{
              px: 4.5,
              py: 1,
              fontWeight: 800,
              borderRadius: 2,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
            }}
          >
            Download PDF
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              sessionStorage.clear();
              navigate("/");
            }}
            sx={{
              px: 4.5,
              py: 1,
              fontWeight: 700,
              color: "white",
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
