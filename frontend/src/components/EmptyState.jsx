import React from "react";
import { Box, Typography } from "@mui/material";

const EmptyState = ({ league, playedResultsCount, totalMatchdays }) => {
  return (
    <Box
      sx={{
        textAlign: "center",
        mt: 4,
        p: 4,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: 3,
        border: `1px solid rgba(${
          league === "UEL" ? "255,152,0" : "0,255,136"
        }, 0.3)`,
      }}
    >
      <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 600, mb: 2 }}>
        {playedResultsCount > 0 ? "All Matchdays Complete!" : "No Matches Available"}
      </Typography>
      <Typography sx={{ color: "white", fontSize: "1.1rem", opacity: 0.8 }}>
        {playedResultsCount > 0
          ? `All ${totalMatchdays} matchdays have been played. Check the standings above!`
          : "No matches are currently scheduled for this league."}
      </Typography>
    </Box>
  );
};

export default EmptyState;