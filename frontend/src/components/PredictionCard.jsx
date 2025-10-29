import React, { useRef } from "react";
import { Card, CardHeader, CardContent, CardActions, Button, Typography, Box, Alert } from "@mui/material";
import PredictionForm from "./PredictionForm";
import { leagueColors, leagueFullNames } from "../constants/leagueConstants";

const PredictionCard = ({
  currentMatchday,
  matches,
  league,
  currentDayIndex,
  matchdayKeys,
  predictions,
  setPredictions,
  onNavigate,
  onSubmit,
}) => {
  const [showError, setShowError] = React.useState(false);
  const formRef = useRef(null);
  const getLeagueRGB = () => {
    if (league === "UCL") return "27,0,148";
    if (league === "UEL") return "255,152,0";
    if (league === "UCFL") return "0,255,136";
    return "0,0,0";
  };

  const leagueRGB = getLeagueRGB();

  const handleNextClick = async () => {
    if (formRef.current) {
      const { allFilled, scrollToUnfilled } = formRef.current;
      if (!allFilled) {
        setShowError(true);
        scrollToUnfilled();
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }
    setShowError(false);
    await onSubmit();
  };

  const isLastMatchday = currentDayIndex === matchdayKeys.length - 1;
  const currentPredictions = predictions[currentMatchday] || {};
  const filledCount = Object.values(currentPredictions).filter(
    (pred) => pred && pred.homeScore !== "" && pred.awayScore !== ""
  ).length;
  const totalMatches = matches?.length || 0;

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: `0 20px 40px rgba(${leagueRGB}, 0.3)`,
        background: `rgba(0,0,0,0.8)`,
        backdropFilter: "blur(20px)",
        border: `1px solid rgba(${leagueRGB}, 0.2)`,
      }}
    >
      <CardHeader
        title={
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
            Matchday {currentMatchday}
          </Typography>
        }
        subheader={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, flexWrap: "wrap" }}>
            <Typography
              sx={{ color: leagueColors[league] || "#00ff88", opacity: 0.8 }}
            >
              {leagueFullNames[league] || league}
            </Typography>
          </Box>
        }
        sx={{
          backgroundColor: "rgba(0,0,0,0.4)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      />
      <CardContent>
        {showError && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              backgroundColor: `rgba(${leagueRGB}, 0.1)`,
              border: `1px solid ${leagueColors[league] || "#ff9800"}`,
              color: "#ffb74d",
              borderRadius: 2,
              "& .MuiAlert-icon": {
                color: leagueColors[league] || "#ff9800",
              },
            }}
          >
            Please fill in all match predictions before proceeding!
          </Alert>
        )}
        <PredictionForm
          ref={formRef}
          matches={matches}
          onSubmit={(formattedPreds) => {
            setPredictions((prev) => ({ ...prev, [currentMatchday]: formattedPreds }));
          }}
          league={league}
          showSubmit={isLastMatchday}
        />
      </CardContent>
      <CardActions sx={{ justifyContent: "space-between", p: 3 }}>
        <Button
          disabled={currentDayIndex === 0}
          onClick={() => onNavigate("back")}
          variant="outlined"
          sx={{
            borderRadius: "25px",
            px: 4,
            py: 1.5,
            borderColor: "rgba(255,255,255,0.3)",
            color: "white",
            "&:hover": {
              borderColor: leagueColors[league] || "#00ff88",
              backgroundColor: `rgba(${leagueRGB}, 0.1)`,
            },
            "&:disabled": {
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.3)",
            },
          }}
        >
          ← Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNextClick}
          sx={{
            borderRadius: "25px",
            px: 4,
            py: 1.5,
            backgroundColor: leagueColors[league] || "#00ff88",
            color: "black",
            fontWeight: 700,
            "&:hover": {
              opacity: 0.9,
              backgroundColor: leagueColors[league] || "#00ff88",
            },
          }}
        >
          {isLastMatchday ? "Finish →" : "Next Matchday →"}
        </Button>
      </CardActions>
    </Card>
  );
};

export default PredictionCard;
