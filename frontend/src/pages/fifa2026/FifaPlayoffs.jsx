import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../api/fifaApi";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import LeagueSelector from "../../components/LeagueSelector";
import { fifaTheme } from "../../constants/fifaTheme";

/* ---------------- HELPERS (UNCHANGED) ---------------- */

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

/* ---------------- COMPONENT ---------------- */

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
          sessionStorage.setItem("fifa_playoffs", JSON.stringify(res.state));
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: fifaTheme.background.base,
        p: { xs: 2, md: 6 },
        position: "relative",
      }}
    >

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

      {loading ? (
        <Box sx={{ p: 4 }}>Loading playoffs…</Box>
      ) : !state ? (
        <Box sx={{ p: 4 }}>No playoffs data.</Box>
      ) : (
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              fontWeight: 900,
              letterSpacing: "0.12em",
              mb: 4,
              color: "#e6faff",
              textShadow: `
                0 0 18px rgba(120, 255, 120, 0.45),
                0 0 36px rgba(147, 255, 120, 0.45)
              `,
            }}
          >
            FIFA WORLD CUP 2026
          </Typography>

          <Typography
          variant="h4"
          sx={{ color: fifaTheme.gold, textAlign: "center", mb: 6 }}
        >
          Predict Playoffs
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


          {/* Block Selector */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 6 }}>
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

          {/* Rounds */}
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

          {/* Winner */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="subtitle2">Playoff Winner</Typography>
            <Typography variant="h5">
              {playoffWinner || "Not decided"}
            </Typography>
          </Box>

          {/* Continue */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: { xs: 5, md: 6 },
              mb: { xs: 2, md: 0 },
            }}
          >
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
                  sessionStorage.setItem(
                    "fifa_state",
                    JSON.stringify(res.state)
                  );
                  navigate("/fifa/groups");
                }
              }}
              sx={{
                position: "relative",
                px: { xs: 4, sm: 5 },
                py: 1.6,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: "18px",

                /* Crystal Glass Base */
                background:
                  "linear-gradient(135deg, rgba(200,245,255,0.35), rgba(120,190,255,0.25))",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",

                /* Glow */
                boxShadow:
                  "0 0 18px rgba(120,220,255,0.55), 0 0 42px rgba(120,220,255,0.35), inset 0 1px 1px rgba(255,255,255,0.65)",

                color: "#00263f",
                border: "1px solid rgba(255,255,255,0.55)",

                transition: "all 0.35s ease",

                "&:hover": {
                  transform: "translateY(-2px) scale(1.03)",
                  background:
                    "linear-gradient(135deg, rgba(220,255,255,0.55), rgba(150,220,255,0.45))",
                  boxShadow:
                    "0 0 24px rgba(120,240,255,0.9), 0 0 60px rgba(120,220,255,0.65), inset 0 1px 1px rgba(255,255,255,0.8)",
                },

                "&:active": {
                  transform: "translateY(0) scale(0.98)",
                },

                "&.Mui-disabled": {
                  background: "rgba(120,120,120,0.25)",
                  boxShadow: "none",
                  color: "#aaa",
                  border: "1px solid rgba(255,255,255,0.2)",
                },

                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: 2,
                  borderRadius: "16px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05))",
                  pointerEvents: "none",
                },
              }}
            >
              Enter Group Stage
            </Button>
          </Box>
        </Container>
      )}
    </Box>
  );
}
