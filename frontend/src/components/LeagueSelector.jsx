import React from "react";
import { Card, CardHeader, CardContent, Typography, Box } from "@mui/material";
import { leagueColors } from "../constants/leagueConstants";

const LeagueSelector = ({ league, onLeagueChange }) => {
  // Determine color based on league
  const getLeagueRGBA = () => {
    if (league === "UCL") return "27,0,148";
    if (league === "UEL") return "255,152,0";
    if (league === "UCFL") return "0,255,136";
    return "0,0,0";
  };

  const rgbaColor = getLeagueRGBA();

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: `0 20px 40px rgba(${rgbaColor}, 0.3)`,
        background: `linear-gradient(135deg, rgba(${rgbaColor}, 0.1), rgba(0,0,0,0.8))`,
        backdropFilter: "blur(20px)",
        border: `2px solid rgba(${rgbaColor}, 0.3)`,
        position: "absolute",
        top: 0,
        left: 20,
        width: 240,
        height: "fit-content",
        transition: "all 0.3s ease",
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="subtitle1"
            sx={{
              color: league ? leagueColors[league] : "white",
              fontWeight: 700,
              transition: "color 0.3s ease",
            }}
          >
            Select League
          </Typography>
        }
        sx={{
          backgroundColor: "rgba(17, 17, 17, 0)",
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
            padding: "10px 12px",
            borderRadius: "8px",
            border: `2px solid ${leagueColors[league] || "rgba(255,255,255,0.3)"}`,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: leagueColors[league] || "rgba(255,255,255,0.7)",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.95rem",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              boxShadow: `0 0 12px ${leagueColors[league] || "rgba(255,255,255,0.5)"}`,
            },
            "&:focus": {
              outline: "none",
              boxShadow: `0 0 16px ${leagueColors[league] || "rgba(255,255,255,0.7)"}`,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
            "& option": {
              backgroundColor: "#1a1a1a",
              color: "white",
              fontWeight: 500,
            },
            "& option:checked": {
              backgroundColor: leagueColors[league] || "#020b8aff",
              color: "black",
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
