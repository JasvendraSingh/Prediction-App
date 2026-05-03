import React from "react";
import { Card, CardHeader, CardContent, Box, Typography } from "@mui/material";

export default function FifaGroupTable({ tableData = {}, group }) {
  const rows = Object.entries(tableData || {}).map(([team, s]) => ({
    team,
    ...s,
  }));

  rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  if (!rows.length) return null;

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(0,255,255,0.25)",
        boxShadow: "0 0 12px rgba(0,255,255,0.25)",
      }}
    >
      <CardHeader
        title={
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              color: "#ffffff",
              textShadow: "0 0 8px rgba(0,255,255,0.6)",
            }}
          >
            Group {group}
          </Typography>
        }
        sx={{ p: 1 }}
      />

      <CardContent sx={{ p: 0.75 }}>
        {/* HEADER */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(7, 28px) 36px",
            px: 1,
            pb: 0.4,
            fontSize: 11,
            fontWeight: 700,
            color: "#9ff",
            borderBottom: "1px solid rgba(0,255,255,0.25)",
          }}
        >
          <div>Team</div>
          {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
            <div key={h} style={{ textAlign: "center" }}>{h}</div>
          ))}
        </Box>

        {/* ROWS */}
        {rows.map((r) => (
          <Box
            key={r.team}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr repeat(7, 28px) 36px",
              px: 1,
              py: 0.55,
              fontSize: 12,
              color: "#ffffff",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r.team}
            </Typography>

            {[r.played, r.won, r.drawn ?? r.draw, r.lost, r.gf, r.ga, r.gd].map(
              (v, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {v ?? 0}
                </div>
              )
            )}

            <div
              style={{
                textAlign: "center",
                fontWeight: 900,
                color: "#00ffff",
                textShadow: "0 0 8px rgba(0,255,255,0.7)",
              }}
            >
              {r.points ?? 0}
            </div>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
