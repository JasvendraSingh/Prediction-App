import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../api/fifaApi";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import LeagueSelector from "../../components/LeagueSelector";
import { fifaTheme } from "../../constants/fifaTheme";

function matchIsPredicted(match) {
  if (!match || typeof match !== "object") return false;

  const a = match.scoreA;
  const b = match.scoreB;

  if (a === "" || a == null) return false;
  if (b === "" || b == null) return false;

  if (Number(a) === Number(b)) {
    return !!match.penaltyWinner;
  }
  return true;
}

function allPlayoffsPredicted(state) {
  if (!state) return false;

  const ROUND_KEYS = ["round1", "semifinals", "final"];

  for (const block of Object.values(state)) {
    for (const rk of ROUND_KEYS) {
      const round = block?.[rk];
      if (!Array.isArray(round)) continue;

      for (const m of round) {
        if (!matchIsPredicted(m)) return false;
      }
    }
  }
  return true;
}

function computeBlockWinner(block) {
  const f = block?.final?.[0];
  if (!f) return null;

  if (f.winner) return f.winner;
  if (f.scoreA > f.scoreB) return f.teamA;
  if (f.scoreB > f.scoreA) return f.teamB;
  return f.penaltyWinner ?? null;
}

export default function FifaPlayoffs() {
  const navigate = useNavigate();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);

  useEffect(() => {
    const cached = sessionStorage.getItem("fifa_playoffs");

    if (cached) {
      setState(JSON.parse(cached));
      setLoading(false);
      return;
    }

    apiGet("/api/fifa2026/playoffs/init")
      .then((res) => {
        if (res?.success && res.state) {
          setState(res.state);
          sessionStorage.setItem(
            "fifa_playoffs",
            JSON.stringify(res.state)
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const blockKeys = useMemo(
    () => (state ? Object.keys(state) : []),
    [state]
  );

  const safeIndex =
    activeBlockIndex >= blockKeys.length ? 0 : activeBlockIndex;

  const activeKey = blockKeys[safeIndex];
  const activeBlock = state?.[activeKey] ?? null;

  const playoffWinner = useMemo(
    () => computeBlockWinner(activeBlock),
    [activeBlock]
  );

  const canContinue = useMemo(
    () => allPlayoffsPredicted(state),
    [state]
  );

  const ROUND_KEYS = ["round1", "semifinals", "final"];

  const activeRounds = useMemo(() => {
    if (!activeBlock) return [];
    return ROUND_KEYS.filter(
      (r) => Array.isArray(activeBlock[r]) && activeBlock[r].length > 0
    );
  }, [activeBlock]);

  async function handleAutoSubmit(blockKey, roundKey, matchId, payload) {
    const res = await apiPost("/api/fifa2026/playoffs/predict_match", {
      key: blockKey,
      round_type: roundKey,
      match_id: matchId,
      scoreA: payload.scoreA,
      scoreB: payload.scoreB,
      penaltyWinner: payload.penaltyWinner,
      state: state[blockKey],
    });

    if (res?.success && res.state?.[blockKey]) {
      const next = { ...state, [blockKey]: res.state[blockKey] };
      setState(next);
      sessionStorage.setItem("fifa_playoffs", JSON.stringify(next));
    }
  }

  let content = null;

  if (loading) {
    content = <div style={{ padding: 32 }}>Loading playoffs…</div>;
  } else if (!state || blockKeys.length === 0) {
    content = <div style={{ padding: 32 }}>No playoffs data.</div>;
  } else {
    content = (
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ color: fifaTheme.gold, textAlign: "center", mb: 15 }}
        >
          Predict Playoffs
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          {blockKeys.map((k, idx) => (
            <Button
              key={k}
              variant={idx === safeIndex ? "contained" : "outlined"}
              onClick={() => setActiveBlockIndex(idx)}
            >
              {state[k].slot_name || k}
            </Button>
          ))}
        </Box>

        {activeRounds.map((roundKey) => (
          <Box key={roundKey} sx={{ mb: 4 }}>
            <FifaPredictionCard
              matches={activeBlock[roundKey]}
              mode="playoff"
              roundKey={roundKey}
              leagueTitle={roundKey.toUpperCase()}
              onAutoSubmit={(rk, id, payload) =>
                handleAutoSubmit(activeKey, rk, id, payload)
              }
            />
          </Box>
        ))}

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="subtitle2">Playoff Winner</Typography>
          <Typography variant="h5">
            {playoffWinner || "Not decided"}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            disabled={!canContinue}
            onClick={async () => {
              const res = await apiPost(
                "/api/fifa2026/playoffs/commit_to_groups",
                {
                  user_id: "guest",
                  playoffs_state: state,
                }
              );

              if (res?.success && res.state) {
                sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
                navigate("/fifa/groups");
              }
            }}
            sx={{
              position: "relative",
              px: 5,
              py: 1.6,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: "14px",

              background:
                "linear-gradient(135deg, rgba(180,240,255,0.9), rgba(90,180,255,0.9))",
              backdropFilter: "blur(6px)",

              boxShadow:
                "0 0 12px rgba(120,220,255,0.6), 0 0 28px rgba(120,220,255,0.45), inset 0 1px 1px rgba(255,255,255,0.6)",

              color: "#003049",

              transition: "all 0.35s ease",

              "&:hover": {
                transform: "translateY(-2px) scale(1.02)",
                boxShadow:
                  "0 0 18px rgba(120,220,255,0.9), 0 0 42px rgba(120,220,255,0.7), inset 0 1px 1px rgba(255,255,255,0.75)",
                background:
                  "linear-gradient(135deg, rgba(200,255,255,0.95), rgba(110,200,255,0.95))",
              },

              "&:active": {
                transform: "translateY(0) scale(0.98)",
              },

              "&.Mui-disabled": {
                background: "rgba(120,120,120,0.3)",
                boxShadow: "none",
                color: "#aaa",
              },

              "&::after": {
                content: '""',
                position: "absolute",
                top: 2,
                left: 4,
                right: 4,
                height: "35%",
                borderRadius: "12px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.55), transparent)",
                pointerEvents: "none",
              },
            }}
          >
            Enter Group Stage
          </Button>
        </Box>

      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base, p: 6 }}>
          <LeagueSelector
            league="fifa2026"
            onLeagueChange={(l) => {
              if (l !== "fifa2026") {
                sessionStorage.clear();
                navigate("/");
              }
            }}
          />
      {content}
    </Box>
  );
}
