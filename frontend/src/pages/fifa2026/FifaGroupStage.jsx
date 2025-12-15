import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import FifaGroupTable from "../../components/FifaGroupTable";
import { apiPost } from "../../api/fifaApi";
import { fifaTheme } from "../../constants/fifaTheme";
import LeagueSelector from "../../components/LeagueSelector";

const GROUP_ORDER = "ABCDEFGHIJKL".split("");

export default function FifaGroupStage() {
  const navigate = useNavigate();

  const [state, setState] = useState(() => {
    const s = sessionStorage.getItem("fifa_state");
    return s ? JSON.parse(s) : null;
  });

  const [matchday, setMatchday] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) navigate("/fifa");
  }, [state, navigate]);

  if (!state) return <div style={{ padding: 20 }}>Loading…</div>;

  /* ----------------- MATCHDAY FIXTURES ----------------- */
  const matchdayMatches = useMemo(() => {
    const out = [];
    for (const g of GROUP_ORDER) {
      const list = state.matches?.[g] || [];
      list.forEach((m) => {
        if (m.matchday === matchday) out.push(m);
      });
    }
    return out;
  }, [state, matchday]);

  /* ----------------- MATCHDAY COMPLETION CHECK ----------------- */
  const isCurrentMatchdayComplete = useMemo(() => {
    if (!matchdayMatches.length) return false;
    return matchdayMatches.every(
      (m) =>
        m.played === true &&
        m.scoreA !== null &&
        m.scoreB !== null
    );
  }, [matchdayMatches]);

  /* ----------------- SUBMIT HANDLER ----------------- */
  async function handleAutoSubmit(matchId, payload) {
    setLoading(true);
    try {
      const next = { ...state, matches: { ...state.matches } };

      for (const g of Object.keys(next.matches)) {
        next.matches[g] = next.matches[g].map((m) =>
          m.id === matchId
            ? {
                ...m,
                played: true,
                scoreA: payload.scoreA,
                scoreB: payload.scoreB,
              }
            : m
        );
      }

      const res = await apiPost("/api/fifa2026/submit_group_results", {
        user_id: "guest",
        state: next,
      });

      if (res?.success && res.state) {
        sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
        setState(res.state);
      }
    } finally {
      setLoading(false);
    }
  }

  /* ----------------- AUTO-ADVANCE ON FINAL MATCHDAY ----------------- */
  useEffect(() => {
    if (matchday === 3 && isCurrentMatchdayComplete) {
      (async () => {
        try {
          const res = await apiPost("/api/fifa2026/generate_r32", { state });
          if (res?.success && res.state) {
            sessionStorage.setItem(
              "fifa_state",
              JSON.stringify(res.state)
            );
            navigate("/fifa/knockouts");
          }
        } catch (err) {
          console.error("Failed to generate knockouts", err);
        }
      })();
    }
  }, [matchday, isCurrentMatchdayComplete, state, navigate]);

  /* ----------------- RENDER ----------------- */
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

      <Container maxWidth="xl">
        <Typography
          variant="h3"
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            textAlign: "center",
            mb: 3,
            textShadow: "0 0 16px rgba(0,255,255,0.5)",
          }}
        >
          Group Stage
        </Typography>

        {/* MATCHDAY CONTROLS */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          <Button
            disabled={matchday === 1}
            onClick={() => setMatchday((d) => d - 1)}
          >
            Prev
          </Button>

          <Typography sx={{ fontWeight: 800, color: "#fff" }}>
            Matchday {matchday}
          </Typography>

          <Button
            disabled={!isCurrentMatchdayComplete}
            onClick={async () => {
              if (matchday < 3) {
                setMatchday((d) => d + 1);
                return;
              }

              try {
                const res = await apiPost("/api/fifa2026/generate_r32", { state });
                if (res?.success && res.state) {
                  sessionStorage.setItem(
                    "fifa_state",
                    JSON.stringify(res.state)
                  );
                  navigate("/fifa/knockouts");
                }
              } catch (err) {
                console.error(err);
              }
            }}
          >
            {matchday < 3 ? "Next" : "Go to Knockouts"}
          </Button>
        </Box>

        {/* MAIN CONTENT */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            gap: 3,
            alignItems: "flex-start",
          }}
        >
          <FifaPredictionCard
            matches={matchdayMatches}
            mode="group"
            leagueTitle={`Matchday ${matchday}`}
            disabled={loading}
            onAutoSubmit={(_, id, payload) =>
              handleAutoSubmit(id, payload)
            }
          />

          {/* GROUP TABLE */}
          <Box
            sx={{
              position: "relative",
              borderRadius: 4,
              p: 1.2,
              background:
                "linear-gradient(180deg, rgba(10,15,20,0.65), rgba(5,5,8,0.85))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0,255,255,0.35)",
              boxShadow: `
                0 0 18px rgba(0,255,255,0.45),
                0 0 40px rgba(0,255,255,0.25)
              `,
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontWeight: 900,
                textAlign: "center",
                mb: 1,
                fontSize: 14,
                letterSpacing: 1,
                textShadow: "0 0 12px rgba(0,255,255,0.6)",
              }}
            >
              GROUPS
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {GROUP_ORDER.map((g) => (
                <FifaGroupTable
                  key={g}
                  group={g}
                  tableData={state.group_tables?.[g] || {}}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
