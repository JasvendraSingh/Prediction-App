import React from "react";
import { Card, CardHeader, CardContent, Typography, Box } from "@mui/material";
import { leagueColors } from "../constants/leagueConstants";

const LeagueSelector = ({ league, onLeagueChange }) => {
  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: `0 20px 40px rgba(${
          league === "UEL" ? "255,152,0" : league === "UCFL" ? "0,255,136" : "0,0,0"
        }, 0.3)`,
        background: `linear-gradient(135deg, rgba(${
          league === "UEL" ? "255,152,0" : league === "UCFL" ? "0,255,136" : "0,0,0"
        }, 0.1), rgba(0,0,0,0.8))`,
        backdropFilter: "blur(20px)",
        border: `2px solid rgba(${
          league === "UEL" ? "255,152,0" : league === "UCFL" ? "0,255,136" : "255,255,255"
        }, 0.3)`,
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
          <option value="UEL">UEFA Europa League</option>
          <option value="UCFL">UEFA Conference League</option>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeagueSelector;