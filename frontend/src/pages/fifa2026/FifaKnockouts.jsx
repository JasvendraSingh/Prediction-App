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
  final: "Final & Third Place",
};

function isStageComplete(state, stage) {
  if (!state) return false;

  if (stage === "final") {
    return (
      state.final?.winner &&
      state.third_place?.winner
    );
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
  }, []);

  const activeMatches = useMemo(() => {
    if (!state) return [];

    if (stage === "final") {
      const matches = [];
      if (state.third_place)
        matches.push({ ...state.third_place, match: "THIRD_PLACE" });
      if (state.final)
        matches.push({ ...state.final, match: "FINAL" });
      return matches;
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
      const target =
        matchId === "THIRD_PLACE" ? "third_place" : "final";
      next[target] = {
        ...next[target],
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
    <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base, p: 6 }}>
      <LeagueSelector league="fifa2026" />

      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ color: fifaTheme.gold, textAlign: "center", mb: 12 }}>
          {ROUND_LABELS[stage]}
        </Typography>

        <FifaPredictionCard
          matches={activeMatches}
          mode="playoff"
          roundKey={stage}
          onAutoSubmit={handleAutoSubmit}
        />

        <Box sx={{ textAlign: "center", mt: 6 }}>
          <Button
            variant="contained"
            disabled={!canProceed}
            onClick={proceed}
          >
            {stage === "final" ? "View Results" : "Proceed"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
