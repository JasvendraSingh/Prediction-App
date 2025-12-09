import React from "react";
import { Card, CardHeader, CardContent, Box, Typography } from "@mui/material";
import { fifaTheme } from "../constants/fifaTheme";

export default function FifaGroupTable({ tableData = {}, group }) {
  const rows = Object.entries(tableData || {}).map(([team, s]) => ({ team, ...s }));
  rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

  if (!rows.length) return null;

  return (
    <Card
      sx={{
        borderRadius: 3,
        background: "rgba(0,0,0,0.6)",
        border: `1px solid ${fifaTheme.goldSoft}`,
      }}
    >
      <CardHeader
        title={<Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 800 }}>Group {group}</Typography>}
        sx={{ background: "rgba(255,255,255,0.02)", p: 1.5 }}
      />
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ fontSize: 12, color: "white", fontWeight: 700, mb: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr repeat(8,auto)", gap: 1, alignItems: "center", px: 1 }}>
            <div>Team</div>
            <div style={{ textAlign: "center" }}>P</div>
            <div style={{ textAlign: "center" }}>W</div>
            <div style={{ textAlign: "center" }}>D</div>
            <div style={{ textAlign: "center" }}>L</div>
            <div style={{ textAlign: "center" }}>GF</div>
            <div style={{ textAlign: "center" }}>GA</div>
            <div style={{ textAlign: "center" }}>GD</div>
            <div style={{ textAlign: "center", color: fifaTheme.gold }}>Pts</div>
          </Box>
        </Box>

        <Box>
          {rows.map((r, i) => (
            <Box
              key={r.team}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr repeat(8,auto)",
                gap: 1,
                alignItems: "center",
                px: 1,
                py: 1,
                background: i === 0 ? "rgba(255,215,0,0.04)" : i === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                color: "white",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <img
                  src={`https://flagcdn.com/w20/${r.team
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/’/g, "")
                    .replace(/'/g, "")
                    .replace(/ö/g, "o")
                    .replace(/ç/g, "c")}.png`}
                  alt={r.team}
                  style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2 }}
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                />
                <span style={{ fontWeight: 700 }}>{r.team}</span>
              </Box>
              <div style={{ textAlign: "center" }}>{r.played ?? 0}</div>
              <div style={{ textAlign: "center" }}>{r.won ?? 0}</div>
              <div style={{ textAlign: "center" }}>{r.drawn ?? r.draw ?? 0}</div>
              <div style={{ textAlign: "center" }}>{r.lost ?? 0}</div>
              <div style={{ textAlign: "center" }}>{r.gf ?? 0}</div>
              <div style={{ textAlign: "center" }}>{r.ga ?? 0}</div>
              <div style={{ textAlign: "center" }}>{r.gd ?? 0}</div>
              <div style={{ textAlign: "center", fontWeight: 800, color: fifaTheme.gold }}>{r.points ?? 0}</div>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
