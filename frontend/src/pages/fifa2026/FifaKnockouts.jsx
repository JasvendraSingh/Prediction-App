import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../api/fifaApi";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import LeagueSelector from "../../components/LeagueSelector";
import { fifaTheme } from "../../constants/fifaTheme";

const ROUND_FLOW = ["r32", "r16", "qf", "sf", "final"];

const ROUND_LABELS = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter Finals",
  sf: "Semi Finals",
  final: "Finals",
};

function isStageComplete(state, stage) {
  if (!state) return false;

  if (stage === "final") {
    return state.final?.winner && state.third_place?.winner;
  }

  return state[stage]
    ? Object.values(state[stage]).every((m) => !!m.winner)
    : false;
}

export default function FifaKnockouts() {
  const navigate = useNavigate();

  const [state, setState] = useState(
    JSON.parse(sessionStorage.getItem("fifa_state") || "null")
  );
  const [stage, setStage] = useState("r32");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) navigate("/fifa/groups");
  }, [state, navigate]);

  const activeMatches = useMemo(() => {
    if (!state) return [];

    if (stage === "final") {
      return [];
    }

    return state[stage]
      ? Object.entries(state[stage]).map(([slot, m]) => ({
          ...m,
          match: slot,
        }))
      : [];
  }, [state, stage]);

  async function handleAutoSubmit(_, matchId, payload) {
    const match =
      stage === "final"
        ? matchId === "THIRD_PLACE"
          ? state.third_place
          : state.final
        : state[stage]?.[matchId];

    if (!match) return;

    const res = await apiPost("/api/fifa2026/predict_knockout_match", {
      user_id: localStorage.getItem("username") || "guest",
      stage,
      match_slot: matchId,
      teamA: match.teamA,
      teamB: match.teamB,
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      penaltyWinner: payload.penaltyWinner,
    });

    if (!res?.success) return;

    const next = { ...state };

    if (stage === "final") {
      const key = matchId === "THIRD_PLACE" ? "third_place" : "final";
      next[key] = {
        ...next[key],
        scoreA: res.scoreA,
        scoreB: res.scoreB,
        penaltyWinner: payload.penaltyWinner ?? null,
        winner: res.winner,
      };
    } else {
      next[stage][matchId] = {
        ...next[stage][matchId],
        scoreA: res.scoreA,
        scoreB: res.scoreB,
        penaltyWinner: payload.penaltyWinner ?? null,
        winner: res.winner,
      };
    }

    sessionStorage.setItem("fifa_state", JSON.stringify(next));
    setState(next);
  }

  const currentIndex = ROUND_FLOW.indexOf(stage);
  const nextStage = ROUND_FLOW[currentIndex + 1];
  const canProceed = isStageComplete(state, stage);

  async function proceed() {
    if (stage === "final") {
      navigate("/fifa/winner");
      return;
    }

    setLoading(true);
    const res = await apiPost(`/api/fifa2026/generate_${nextStage}`, {
      user_id: "guest",
      state,
    });

    if (res?.success) {
      sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
      setState(res.state);
      setStage(nextStage);
    }
    setLoading(false);
  }

  if (loading) return <div>Loading…</div>;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: fifaTheme.background.base,
        p: { xs: 2, md: 6 },
        position: "relative",
      }}
    >
      {/* Desktop League Selector */}
      <Box
        sx={{
          display: { xs: "none", md: "block" },
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 10,
        }}
      >
        <LeagueSelector
          league="fifa2026"
          onLeagueChange={(l) => {
            if (l !== "fifa2026") {
              sessionStorage.clear();
              navigate("/");
            }
          }}
        />
      </Box>

      <Container maxWidth="lg">
        {/* Heading */}
          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              fontWeight: 900,
              letterSpacing: "0.12em",
              mb: 4,
              color: "#e6faff",
              textShadow: `
                0 0 18px rgba(120,220,255,0.65),
                0 0 36px rgba(120,220,255,0.45)
              `,
            }}
          >
            FIFA WORLD CUP 2026
          </Typography>        

        <Typography
          variant="h4"
          sx={{
            color: fifaTheme.gold,
            textAlign: "center",
            mb: 6,
            fontWeight: 900,
            textShadow: "0 0 16px rgba(120,220,255,0.5)",
          }}
        >
          {ROUND_LABELS[stage]}
        </Typography>

        {/* Mobile League Selector */}
        <Box sx={{ display: { xs: "block", md: "none" }, mb: 4 }}>
          <LeagueSelector
            league="fifa2026"
            onLeagueChange={(l) => {
              if (l !== "fifa2026") {
                sessionStorage.clear();
                navigate("/");
              }
            }}
          />
        </Box>

        {/* NORMAL ROUNDS */}
        {stage !== "final" && (
          <FifaPredictionCard
            matches={activeMatches}
            mode="playoff"
            roundKey={stage}
            onAutoSubmit={handleAutoSubmit}
          />
        )}

        {/* FINAL STAGE */}
        {stage === "final" && (
          <>
            {/* THIRD PLACE */}
            <Typography
              sx={{
                textAlign: "center",
                fontWeight: 900,
                mt: 2,
                mb: 2,
                color: "#ffcc99",
                letterSpacing: 1,
              }}
            >
              THIRD PLACE PLAYOFF
            </Typography>

            <FifaPredictionCard
              matches={[{ ...state.third_place, match: "THIRD_PLACE" }]}
              mode="playoff"
              roundKey="final"
              onAutoSubmit={handleAutoSubmit}
            />

            {/* FINAL */}
            <Typography
              sx={{
                textAlign: "center",
                fontWeight: 900,
                mt: 5,
                mb: 2,
                color: "#bdefff",
                letterSpacing: 1.2,
              }}
            >
              WORLD CUP FINAL
            </Typography>

            <FifaPredictionCard
              matches={[{ ...state.final, match: "FINAL" }]}
              mode="playoff"
              roundKey="final"
              onAutoSubmit={handleAutoSubmit}
            />
          </>
        )}

        {/* Proceed Button */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <Button
            variant="contained"
            disabled={!canProceed}
            onClick={proceed}
            sx={{
              position: "relative",
              px: 5,
              py: 1.6,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, rgba(200,245,255,0.35), rgba(120,190,255,0.25))",
              backdropFilter: "blur(14px)",
              boxShadow:
                "0 0 18px rgba(120,220,255,0.55), 0 0 42px rgba(120,220,255,0.35)",
              color: "#00263f",
            }}
          >
            {stage === "final" ? "View Results" : "Proceed"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
