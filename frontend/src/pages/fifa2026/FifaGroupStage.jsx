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

      <Container maxWidth="xl">
        {/* PAGE HEADING */}
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
          variant="h3"
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            textAlign: "center",
            mb: 6,
            textShadow: "0 0 16px rgba(0,255,255,0.5)",
          }}
        >
          Group Stage
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

        {/* MATCHDAY CONTROLS */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.5, sm: 3 },
              px: { xs: 2.5, sm: 4 },
              py: 1.6,
              borderRadius: "20px",

              /* Glass container */
              background:
                "linear-gradient(135deg, rgba(10,20,30,0.65), rgba(5,10,15,0.85))",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",

              /* Glowing border */
              border: "1px solid rgba(0,255,255,0.45)",
              boxShadow: `
                0 0 16px rgba(0,255,255,0.35),
                0 0 36px rgba(0,255,255,0.25)
              `,
            }}
          >
            {/* Prev */}
            <Button
              disabled={matchday === 1}
              onClick={() => setMatchday((d) => d - 1)}
              sx={{
                minWidth: 90,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderRadius: "14px",

                color: "#e0ffff",

                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))",

                border: "1px solid rgba(0,255,255,0.5)",

                boxShadow: "0 0 10px rgba(0,255,255,0.35)",

                transition: "all 0.25s ease",

                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,150,200,0.25))",
                  boxShadow:
                    "0 0 14px rgba(0,255,255,0.75), 0 0 28px rgba(0,255,255,0.45)",
                  transform: "translateY(-1px)",
                },

                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "none",
                },
              }}
            >
              Prev
            </Button>

            {/* Matchday label */}
            <Typography
              sx={{
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "0.1em",
                textShadow: "0 0 10px rgba(0,255,255,0.6)",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              MATCHDAY {matchday}
            </Typography>

            {/* Next */}
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
              sx={{
                minWidth: 90,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderRadius: "14px",

                color: "#e0ffff",

                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))",

                border: "1px solid rgba(0,255,255,0.6)",

                boxShadow: "0 0 12px rgba(0,255,255,0.45)",

                transition: "all 0.25s ease",

                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgba(0,255,255,0.25), rgba(0,180,220,0.3))",
                  boxShadow:
                    "0 0 18px rgba(0,255,255,0.9), 0 0 40px rgba(0,255,255,0.6)",
                  transform: "translateY(-1px)",
                },

                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "none",
                },
              }}
            >
              {matchday < 3 ? "Next" : "Knockouts"}
            </Button>
          </Box>
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
