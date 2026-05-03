import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { fifaTheme } from "../constants/fifaTheme";

export default function FifaGroupTable({ tableData = {}, group }) {
  const rows = Object.entries(tableData || {}).map(([team, s]) => ({
    team,
    ...s,
  }));

  rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  if (!rows.length) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
        mb: 2,
      }}
    >
      {/* Header / Group Title */}
      <Box sx={{ 
        px: 2, 
        py: 1, 
        background: "linear-gradient(90deg, rgba(0, 180, 255, 0.15), transparent)",
        borderBottom: "1px solid rgba(0, 180, 255, 0.2)"
      }}>
        <Typography sx={{ fontWeight: 900, color: fifaTheme.cyan, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase" }}>
          Group {group}
        </Typography>
      </Box>

      <Box sx={{ p: 1 }}>
        {/* Table Head */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(7, 26px) 34px",
            px: 1,
            pb: 1,
            fontSize: 10,
            fontWeight: 800,
            color: fifaTheme.text.muted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          <div>Team</div>
          {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
            <div key={h} style={{ textAlign: "center" }}>{h}</div>
          ))}
        </Box>

        {/* Rows */}
        {rows.map((r, idx) => {
          const isTop2 = idx < 2;
          return (
            <Box
              key={r.team}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr repeat(7, 26px) 34px",
                px: 1,
                py: 0.8,
                fontSize: 12,
                color: fifaTheme.text.primary,
                borderRadius: 1,
                transition: "background 0.2s",
                background: isTop2 ? "rgba(0, 255, 118, 0.03)" : "transparent",
                borderLeft: isTop2 ? `3px solid ${fifaTheme.success}` : "3px solid transparent",
                "&:hover": { background: "rgba(255,255,255,0.05)" },
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.team}
              </Typography>

              {[r.played, r.won, r.drawn ?? r.draw, r.lost, r.gf, r.ga, r.gd].map((v, i) => (
                <div key={i} style={{ textAlign: "center", fontWeight: 600, opacity: i === 6 ? 1 : 0.8, color: i === 6 && v > 0 ? fifaTheme.success : i === 6 && v < 0 ? fifaTheme.error : "inherit" }}>
                  {v ?? 0}
                </div>
              ))}

              <div style={{ textAlign: "center", fontWeight: 900, color: fifaTheme.cyan }}>
                {r.points ?? 0}
              </div>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
