import React from "react";
import { Card, CardHeader, CardContent, Typography, Box } from "@mui/material";
import { leagueColors } from "../constants/leagueConstants";

const LeagueSelector = ({ league, onLeagueChange, sx = {} }) => {
  const getLeagueRGBA = () => {
    if (league === "UCL") return "27,0,148";
    if (league === "UEL") return "255,152,0";
    if (league === "UCFL") return "0,255,136";
    if (league === "fifa2026") return "180,240,255";
    return "0,0,0";
  };

  const rgbaColor = getLeagueRGBA();

  return (
    <Card
      sx={{
        borderRadius: 4,
        width: { xs: "100%", sm: 260 },
        boxShadow: `0 20px 40px rgba(${rgbaColor}, 0.3)`,
        background: `linear-gradient(135deg, rgba(${rgbaColor}, 0.12), rgba(0,0,0,0.85))`,
        backdropFilter: "blur(20px)",
        border: `2px solid rgba(${rgbaColor}, 0.3)`,
        transition: "all 0.3s ease",
        ...sx, // ✅ responsive positioning controlled by parent
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="subtitle1"
            sx={{
              color: league ? leagueColors[league] : "white",
              fontWeight: 700,
            }}
          >
            Select League
          </Typography>
        }
        sx={{
          backgroundColor: "transparent",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "12px 16px",
        }}
      />

      <CardContent sx={{ pb: 2 }}>
        <Box
          component="select"
          value={league}
          onChange={(e) => onLeagueChange(e.target.value)}
          sx={{
            width: "100%",
            minHeight: 44, // ✅ mobile tap target
            padding: "10px 12px",
            borderRadius: "8px",
            border: `2px solid ${leagueColors[league] || "rgba(255,255,255,0.3)"}`,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            color: leagueColors[league] || "rgba(255,255,255,0.85)",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.25s ease",

            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.75)",
            },

            "&:focus": {
              outline: "none",
              boxShadow: `0 0 16px ${leagueColors[league] || "rgba(255,255,255,0.6)"}`,
            },

            "& option": {
              backgroundColor: "#1a1a1a",
              color: "white",
            },
          }}
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
