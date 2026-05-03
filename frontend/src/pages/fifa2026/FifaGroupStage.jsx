import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Button, IconButton, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import FifaPredictionCard from "../../components/FifaPredictionCard";
import FifaGroupTable from "../../components/FifaGroupTable";
import { apiPost } from "../../api/fifaApi";
import { fifaTheme } from "../../constants/fifaTheme";

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
    if (state) return;
    const username = localStorage.getItem("username") || "guest";
    apiPost("/api/fifa2026/init", { user_id: username })
      .then((res) => {
        if (res?.success && res.state) {
          sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
          setState(res.state);
        } else {
          navigate("/");
        }
      })
      .catch(() => navigate("/"));
  }, [state, navigate]);

  const username = localStorage.getItem("username") || "guest";

  const matchdayMatches = useMemo(() => {
    const out = [];
    for (const g of GROUP_ORDER) {
      const list = state?.matches?.[g] || [];
      list.forEach((m) => { if (m.matchday === matchday) out.push(m); });
    }
    return out;
  }, [state, matchday]);

  const isCurrentMatchdayComplete = useMemo(() =>
    matchdayMatches.length > 0 && matchdayMatches.every((m) => m.played === true),
  [matchdayMatches]);

  async function handleAutoSubmit(matchId, payload) {
    setLoading(true);
    try {
      const next = { ...state, matches: { ...state.matches } };
      for (const g of Object.keys(next.matches)) {
        next.matches[g] = next.matches[g].map((m) =>
          m.id === matchId ? { ...m, played: true, scoreA: payload.scoreA, scoreB: payload.scoreB } : m
        );
      }
      const res = await apiPost("/api/fifa2026/submit_group_results", { user_id: username, state: next });
      if (res?.success && res.state) {
        sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
        setState(res.state);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProceed() {
    if (matchday < 3) {
      setMatchday((d) => d + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLoading(true);
      try {
        const res = await apiPost("/api/fifa2026/generate_r32", { state });
        if (res?.success && res.state) {
          sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
          navigate("/fifa/knockouts");
        }
      } catch (err) {
        console.error("R32 generation failed", err);
      } finally {
        setLoading(false);
      }
    }
  }

  function handleLogout() {
    sessionStorage.clear();
    localStorage.removeItem("username");
    navigate("/");
  }

  if (!state) return null;

  return (
    <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base, pb: 10 }}>
      {/* --- PRO TOP NAV --- */}
      <Box sx={{ 
        height: 80, 
        px: { xs: 2, md: 6 }, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        background: "rgba(0, 10, 30, 0.4)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 180, 255, 0.15)",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Trophy color={fifaTheme.gold} size={28} />
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#fff", letterSpacing: 1.5, fontSize: { xs: 14, sm: 18 }, textTransform: "uppercase" }}>
              FIFA World Cup 2026
            </Typography>
            <Typography sx={{ color: fifaTheme.text.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Group Stage · <span style={{ color: fifaTheme.cyan }}>{username}</span>
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Logout">
          <IconButton onClick={handleLogout} sx={{ color: fifaTheme.text.muted, "&:hover": { color: fifaTheme.error } }}>
            <LogOut size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 6 }}>
        {/* --- MATCHDAY NAVIGATOR --- */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 6 }}>
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 4, 
            p: 1, 
            px: 3,
            borderRadius: 10, 
            background: "rgba(0,0,0,0.5)", 
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
          }}>
            <IconButton 
              disabled={matchday === 1} 
              onClick={() => setMatchday(d => d - 1)}
              sx={{ color: fifaTheme.cyan, "&.Mui-disabled": { opacity: 0.2 } }}
            >
              <ChevronLeft size={32} />
            </IconButton>

            <Box sx={{ textAlign: "center", minWidth: 160 }}>
              <Typography sx={{ color: fifaTheme.text.muted, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>
                Current Stage
              </Typography>
              <Typography sx={{ color: "#fff", fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>
                MATCHDAY {matchday}
              </Typography>
            </Box>

            <IconButton 
              disabled={!isCurrentMatchdayComplete} 
              onClick={handleProceed}
              sx={{ color: fifaTheme.cyan, "&.Mui-disabled": { opacity: 0.2 } }}
            >
              <ChevronRight size={32} />
            </IconButton>
          </Box>
        </Box>

        {/* --- MAIN GRID --- */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 5, alignItems: "flex-start" }}>
          
          {/* Left: Predictions */}
          <Box>
            <FifaPredictionCard
              matches={matchdayMatches}
              mode="group"
              leagueTitle={`Predictions Matchday ${matchday}`}
              disabled={loading}
              onAutoSubmit={(_, id, payload) => handleAutoSubmit(id, payload)}
            />
          </Box>

          {/* Right: Groups Summary */}
          <Box sx={{ 
            p: 3, 
            borderRadius: 5, 
            background: "rgba(255,255,255,0.02)", 
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)"
          }}>
            <Typography sx={{ fontWeight: 900, color: fifaTheme.text.primary, mb: 3, textAlign: "center", letterSpacing: 2, fontSize: 14 }}>
              LIVE GROUP STANDINGS
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {GROUP_ORDER.map((g) => (
                <FifaGroupTable key={g} group={g} tableData={state.group_tables?.[g]} />
              ))}
            </Box>
          </Box>

        </Box>
      </Container>
    </Box>
  );
}
