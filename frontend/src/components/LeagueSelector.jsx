import React from "react";
import { Card, CardHeader, CardContent, Typography, Box } from "@mui/material";
import { leagueColors } from "../constants/leagueConstants";

const LeagueSelector = ({ league, onLeagueChange }) => {
  // Determine color based on league hex
  const getLeagueRGBA = () => {
    if (!league) return "0,0,0";
    const hex = leagueColors[league] || "#000000";
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r},${g},${b}`;
  };

  const rgbaColor = getLeagueRGBA();

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: `0 20px 40px rgba(${rgbaColor}, 0.18)`,
        background: `linear-gradient(135deg, rgba(${rgbaColor}, 0.06), rgba(0,0,0,0.8))`,
        backdropFilter: "blur(12px)",
        border: `1px solid rgba(${rgbaColor}, 0.18)`,
        position: "absolute",
        top: 16,
        left: 20,
        width: 240,
        transition: "all 0.3s ease",
        zIndex: 10,
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="subtitle1"
            sx={{
              color: leagueColors[league] || "white",
              fontWeight: 700,
            }}
          >
            Select League
          </Typography>
        }
        sx={{ padding: "10px 16px" }}
      />
      <CardContent sx={{ pb: 2 }}>
        <Box
          component="select"
          value={league}
          onChange={(e) => onLeagueChange(e.target.value)}
          sx={{ /* existing styles */ }}
          >
          <option disabled value="">
            Choose League
          </option>
          <option value="UCL">UEFA Champions League</option>
          <option value="UEL">UEFA Europa League</option>
          <option value="UCFL">UEFA Conference League</option>
          <option value="fifa2026">FIFA World Cup 2026</option>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeagueSelector;
