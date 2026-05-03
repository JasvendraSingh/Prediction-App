import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import FifaGroupTable from "../../components/FifaGroupTable";
import { apiPost } from "../../api/fifaApi";
import { fifaTheme } from "../../constants/fifaTheme";

const GROUP_ORDER = "ABCDEFGHIJKL".split("");

export default function FifaGroupStage() {
  const navigate = useNavigate();

  /* ── State: load from sessionStorage or initialise ── */
  const [state, setState] = useState(() => {
    const s = sessionStorage.getItem("fifa_state");
    return s ? JSON.parse(s) : null;
  });

  const [matchday, setMatchday] = useState(1);
  const [loading,  setLoading]  = useState(false);

  /* If state is missing, try initialising from backend */
  useEffect(() => {
    if (state) return;

    const username = localStorage.getItem("username") || "guest";
    apiPost("/api/fifa2026/init", { user_id: username })
      .then((res) => {
        if (res?.success && res.state) {
          sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
          setState(res.state);
        } else {
          // No backend — send user back to login
          navigate("/");
        }
      })
      .catch(() => navigate("/"));
  }, [state, navigate]);

  if (!state) {
    return (
      <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base,
                 display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ color: "#fff" }}>Loading…</Typography>
      </Box>
    );
  }

  /* ── Current username ── */
  const username = localStorage.getItem("username") || "guest";

  /* ── Matchday fixtures ── */
  const matchdayMatches = useMemo(() => {
    const out = [];
    for (const g of GROUP_ORDER) {
      const list = state.matches?.[g] || [];
      list.forEach((m) => { if (m.matchday === matchday) out.push(m); });
    }
    return out;
  }, [state, matchday]);

  /* ── Is current matchday fully predicted? ── */
  const isCurrentMatchdayComplete = useMemo(() =>
    matchdayMatches.length > 0 &&
    matchdayMatches.every(
      (m) => m.played === true && m.scoreA !== null && m.scoreB !== null
    ),
  [matchdayMatches]);

  /* ── Submit one match result ── */
  async function handleAutoSubmit(matchId, payload) {
    setLoading(true);
    try {
      const next = { ...state, matches: { ...state.matches } };
      for (const g of Object.keys(next.matches)) {
        next.matches[g] = next.matches[g].map((m) =>
          m.id === matchId
            ? { ...m, played: true, scoreA: payload.scoreA, scoreB: payload.scoreB }
            : m
        );
      }

      const res = await apiPost("/api/fifa2026/submit_group_results", {
        user_id: username,
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

  /* ── Auto-advance: matchday 3 complete → generate R32 ── */
  useEffect(() => {
    if (matchday === 3 && isCurrentMatchdayComplete) {
      (async () => {
        try {
          const res = await apiPost("/api/fifa2026/generate_r32", { state });
          if (res?.success && res.state) {
            sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
            navigate("/fifa/knockouts");
          }
        } catch (err) {
          console.error("Failed to generate R32:", err);
        }
      })();
    }
  }, [matchday, isCurrentMatchdayComplete, state, navigate]);

  /* ── Proceed button handler ── */
  async function handleProceed() {
    if (matchday < 3) {
      setMatchday((d) => d + 1);
      return;
    }
    try {
      const res = await apiPost("/api/fifa2026/generate_r32", { state });
      if (res?.success && res.state) {
        sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
        navigate("/fifa/knockouts");
      }
    } catch (err) {
      console.error("generate_r32 failed:", err);
    }
  }

  /* ── Logout ── */
  function handleLogout() {
    sessionStorage.clear();
    localStorage.removeItem("username");
    navigate("/");
  }

  /* ════════════════════════════════════════════════════════════ RENDER */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: fifaTheme.background.base,
        p: { xs: 2, md: 5 },
        position: "relative",
      }}
    >
      {/* ── Top bar: title + logout ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* FIFA title */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: "0.1em",
              color: "#e6faff",
              textShadow: "0 0 18px rgba(0,200,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            FIFA World Cup 2026
          </Typography>
          <Typography sx={{ color: "rgba(140,210,255,0.65)", fontSize: 13 }}>
            Logged in as <strong style={{ color: "#7edcff" }}>{username}</strong>
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={handleLogout}
          sx={{
            color: "rgba(200,220,255,0.7)",
            borderColor: "rgba(200,220,255,0.3)",
            borderRadius: 2,
            textTransform: "none",
            "&:hover": { borderColor: "#f77", color: "#f99" },
          }}
        >
          Logout
        </Button>
      </Box>

      <Container maxWidth="xl">
        {/* ── Group Stage heading ── */}
        <Typography
          variant="h3"
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            textAlign: "center",
            mb: 4,
            textShadow: "0 0 16px rgba(0,255,255,0.5)",
          }}
        >
          Group Stage
        </Typography>

        {/* ── Matchday navigator ── */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.5, sm: 3 },
              px: { xs: 2.5, sm: 4 },
              py: 1.6,
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, rgba(10,20,30,0.65), rgba(5,10,15,0.85))",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(0,255,255,0.45)",
              boxShadow:
                "0 0 16px rgba(0,255,255,0.35), 0 0 36px rgba(0,255,255,0.25)",
            }}
          >
            {/* Prev */}
            <Button
              disabled={matchday === 1}
              onClick={() => setMatchday((d) => d - 1)}
              sx={btnStyle}
            >
              Prev
            </Button>

            <Typography
              sx={{
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "0.1em",
                textShadow: "0 0 10px rgba(0,255,255,0.6)",
                minWidth: 130,
                textAlign: "center",
              }}
            >
              MATCHDAY {matchday}
            </Typography>

            {/* Next / Knockouts */}
            <Button
              disabled={!isCurrentMatchdayComplete}
              onClick={handleProceed}
              sx={btnStyle}
            >
              {matchday < 3 ? "Next" : "Knockouts →"}
            </Button>
          </Box>
        </Box>

        {/* ── Main content: prediction card + group tables ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            gap: 3,
            alignItems: "flex-start",
          }}
        >
          {/* Prediction card */}
          <FifaPredictionCard
            matches={matchdayMatches}
            mode="group"
            leagueTitle={`Matchday ${matchday}`}
            disabled={loading}
            onAutoSubmit={(_, id, payload) => handleAutoSubmit(id, payload)}
          />

          {/* Group tables */}
          <Box
            sx={{
              borderRadius: 4,
              p: 1.2,
              background:
                "linear-gradient(180deg, rgba(10,15,20,0.65), rgba(5,5,8,0.85))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0,255,255,0.35)",
              boxShadow:
                "0 0 18px rgba(0,255,255,0.45), 0 0 40px rgba(0,255,255,0.25)",
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
              GROUPS (A – L)
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

/* ── Shared button styles ── */
const btnStyle = {
  minWidth: 90,
  fontWeight: 700,
  letterSpacing: "0.08em",
  borderRadius: "14px",
  color: "#e0ffff",
  background: "linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))",
  border: "1px solid rgba(0,255,255,0.5)",
  boxShadow: "0 0 10px rgba(0,255,255,0.35)",
  transition: "all 0.25s ease",
  "&:hover": {
    background: "linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,150,200,0.25))",
    boxShadow: "0 0 14px rgba(0,255,255,0.75), 0 0 28px rgba(0,255,255,0.45)",
    transform: "translateY(-1px)",
  },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,0.3)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "none",
  },
};
