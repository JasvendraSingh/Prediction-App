import React from "react";
import { Box, Card, CardHeader, CardContent, Chip, Typography } from "@mui/material";
import { leagueColors } from "../constants/leagueConstants";

const CompactLeagueTable = ({ tableData, league, playedResultsCount }) => {
  const tableRowStyle = {
    display: "grid",
    gridTemplateColumns: "25px 1fr 25px 25px 25px 25px 35px",
    gap: "6px",
    padding: "6px",
    alignItems: "center",
    fontSize: "0.75rem",
  };

  if (!tableData || tableData.length === 0) return null;

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: `0 20px 40px rgba(${
          league === "UCL" ? "27,0,148" : league === "UEL" ? "255,152,0" : "0,255,136"
        }, 0.3)`,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(20px)",
        border: `1px solid rgba(${
          league === "UCL" ? "27,0,148" : league === "UEL" ? "255,152,0" : "0,255,136"
        }, 0.2)`,
        position: "sticky",
        top: 20,
        height: "fit-content",
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="subtitle2" sx={{color: "white", fontWeight: 700 }}>
                Current League Table
            </Typography>
          </Box>
        }
        sx={{
          backgroundColor: "rgba(0,0,0,0.4)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "12px",
        }}
      />
      <CardContent sx={{ p: "12px" }}>
        <Box sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
          <Box
            sx={{
              ...tableRowStyle,
              backgroundColor: leagueColors[league],
              color: "black",
              fontWeight: 700,
              borderRadius: "4px 4px 0 0",
            }}
          >
            <Box></Box>
            <Box>Teams</Box>
            <Box textAlign="center">P</Box>
            <Box textAlign="center">W</Box>
            <Box textAlign="center">D</Box>
            <Box textAlign="center">L</Box>
            <Box textAlign="center">Pts</Box>
          </Box>
          {tableData.map((team, idx) => (
            <Box
              key={idx}
              sx={{
                ...tableRowStyle,
                backgroundColor: idx % 2 === 0 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.5)",
                borderBottom: idx === tableData.length - 1 ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: "white",
              }}
            >
              <Box sx={{ fontWeight: 700 }}>{idx + 1}</Box>
              <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.7rem" }}>
                {team.team}
              </Box>
              <Box textAlign="center">{team.played || 0}</Box>
              <Box textAlign="center">{team.won || 0}</Box>
              <Box textAlign="center">{team.draw || 0}</Box>
              <Box textAlign="center">{team.lost || 0}</Box>
              <Box textAlign="center" sx={{ fontWeight: 700 }}>
                {team.points || 0}
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CompactLeagueTable;