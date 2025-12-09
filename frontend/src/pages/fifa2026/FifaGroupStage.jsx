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
  const [state, setState] = useState(() => {
    const s = sessionStorage.getItem("fifa_state");
    return s ? JSON.parse(s) : null;
  });
  const [selectedGroup, setSelectedGroup] = useState(GROUP_ORDER[0]);
  const [matchdayIndex, setMatchdayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!state) navigate("/fifa");
  }, [state]);

  if (!state) return <div style={{ padding: 20, color: "white" }}>Loading...</div>;

  const groups = state.groups || {};
  const matches = state.matches || {};
  const groupTables = state.group_tables || {};

  const currentGroupMatches = matches[selectedGroup] || [];
  const currentMatchdayMatches = currentGroupMatches.filter((m) => m.matchday === matchdayIndex + 1);

  async function handleAutoSubmit(matchId, payload) {
    // Update local state and send api to persist
    const g = selectedGroup;
    setLoading(true);

    try {
      const next = { ...(state || {}) };
      next.matches = { ...(next.matches || {}) };
      next.matches[g] = (next.matches[g] || []).map((m) => {
        const id = m.match || m.id || `${m.teamA}-${m.teamB}`;
        if (id === matchId) {
          return { ...m, played: true, scoreA: payload.scoreA, scoreB: payload.scoreB, penaltyWinner: payload.penaltyWinner };
        }
        return m;
      });

      const res = await apiPost("/api/fifa2026/submit_group_results", {
        user_id: localStorage.getItem("username") || "guest",
        state: next,
      });

      if (res?.success) {
        const newState = res.state || next;
        sessionStorage.setItem("fifa_state", JSON.stringify(newState));
        setState(newState);
        setToast("Saved — group table updated");
        // advance to next match automatically handled by card onAdvance callback in practice
      } else {
        console.warn("Failed saving group results", res);
      }
    } catch (e) {
      console.error("submit_group_results failed", e);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 2000);
    }
  }

  function handleAdvance(nextIndex) {
    if (nextIndex === null) {
      // All matches done for this matchday — advance to next matchday or group
      if (matchdayIndex < 2) setMatchdayIndex((i) => i + 1);
      else {
        const idx = GROUP_ORDER.indexOf(selectedGroup);
        if (idx < GROUP_ORDER.length - 1) {
          setSelectedGroup(GROUP_ORDER[idx + 1]);
          setMatchdayIndex(0);
        }
      }
    } else {
      // focusing inside same matchday — no UI state change needed
    }
  }

  const sidebarTables = useMemo(() => {
    return GROUP_ORDER.map((g) => ({
      group: g,
      table: (state.group_tables && state.group_tables[g]) || {},
      matches: (state.matches && state.matches[g]) || [],
    }));
  }, [state]);

  return (
    <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base, p: 6 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ color: fifaTheme.gold, fontWeight: 900, mb: 3 }}>
          Group Stage — Predict by Group
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 360px", gap: 4 }}>
          <Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
              <Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 800 }}>Selected Group:</Typography>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setMatchdayIndex(0);
                }}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  color: fifaTheme.textPrimary,
                }}
              >
                {GROUP_ORDER.map((g) => (
                  <option key={g} value={g}>
                    Group {g}
                  </option>
                ))}
              </select>

              <Box sx={{ ml: "auto", display: "flex", gap: 2 }}>
                <Button variant="outlined" disabled={matchdayIndex === 0} onClick={() => setMatchdayIndex((i) => Math.max(0, i - 1))}>
                  Prev
                </Button>
                <Typography sx={{ color: fifaTheme.textMuted, alignSelf: "center" }}>Matchday {matchdayIndex + 1} / 3</Typography>
                <Button variant="outlined" disabled={matchdayIndex === 2} onClick={() => setMatchdayIndex((i) => Math.min(2, i + 1))}>
                  Next
                </Button>
              </Box>
            </Box>

            <FifaPredictionCard
              matches={currentMatchdayMatches}
              onAutoSubmit={handleAutoSubmit}
              onAdvance={handleAdvance}
              disabled={loading}
              leagueTitle={`Group ${selectedGroup} — Matchday ${matchdayIndex + 1}`}
            />

            {toast && <div style={{ color: "#6ee7b7", marginTop: 10 }}>{toast}</div>}
          </Box>

          <Box>
            <Typography sx={{ color: fifaTheme.gold, fontWeight: 900, mb: 2 }}>Groups</Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sidebarTables.map((s) => (
                <Box
                  key={s.group}
                  onClick={() => {
                    setSelectedGroup(s.group);
                    setMatchdayIndex(0);
                  }}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: s.group === selectedGroup ? "rgba(246,195,59,0.06)" : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 800 }}>Group {s.group}</Typography>
                    <Typography sx={{ color: fifaTheme.textMuted, fontSize: 12 }}>{s.matches.filter((m) => m.played).length}/6</Typography>
                  </Box>

                  <FifaGroupTable tableData={s.table} group={s.group} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
