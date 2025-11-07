import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import LeagueTable from "./LeagueTable";
import { leagueColors } from "../constants/leagueConstants";

const ResultTableCard = ({ table, league, playedResultsCount, onDownload, onReset }) => {
  const handleDownload = async () => {
    try {
      const username = localStorage.getItem("username") || "guest";
      const key = `predictions_${username}_${league}`;
      const savedPreds = JSON.parse(localStorage.getItem(key) || "{}");
      await onDownload(savedPreds);
    } catch (err) {
      console.error("Error including saved predictions:", err);
    }
  };

  return (
    <Card
      sx={{
        mb: 4,
        borderRadius: 4,
        boxShadow: `0 20px 40px rgba(${
          league === "UCL"
            ? "27,0,148"
            : league === "UEL"
            ? "255,152,0"
            : "0,255,136"
        }, 0.3)`,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(20px)",
        border: `1px solid rgba(${
          league === "UCL"
            ? "27,0,148"
            : league === "UEL"
            ? "255,152,0"
            : "0,255,136"
        }, 0.2)`,
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
              Final League Table
            </Typography>
            <Chip
              label={`Predictions Complete (${playedResultsCount || 0} results)`}
              size="small"
              sx={{
                backgroundColor: leagueColors[league] || "#00ff88",
                color: "black",
                fontWeight: 600,
              }}
            />
          </Box>
        }
      />
      <CardContent>
        <LeagueTable tableData={table} />
      </CardContent>
      <CardActions sx={{ justifyContent: "center", gap: 2, p: 3 }}>
        <Button
          variant="contained"
          onClick={handleDownload}
          sx={{
            borderRadius: "25px",
            px: 4,
            py: 1.5,
            backgroundColor: leagueColors[league] || "#00ff88",
            color: "black",
            fontWeight: 700,
            "&:hover": { opacity: 0.9 },
          }}
        >
          Download PDF
        </Button>

        <Button
          variant="outlined"
          onClick={onReset}
          sx={{
            borderRadius: "25px",
            px: 4,
            py: 1.5,
            borderColor: leagueColors[league] || "#00ff88",
            color: leagueColors[league] || "#00ff88",
            fontWeight: 700,
            "&:hover": {
              borderColor: "#fff",
              color: "#fff",
              background: "rgba(255,255,255,0.1)",
            },
          }}
        >
          Reset League
        </Button>
      </CardActions>
    </Card>
  );
};

export default ResultTableCard;
