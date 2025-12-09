import React, { useEffect, useState } from "react";
import { Box, Container, Typography, TextField, Button } from "@mui/material";
import FifaFlag from "../../components/FifaFlag";
import { apiGet, apiPost } from "../../api/fifaApi";
import { fifaTheme } from "../../constants/fifaTheme";
import { useNavigate } from "react-router-dom";

export default function FifaPlayoffs() {
  const navigate = useNavigate(); 
  const [state, setState] = useState(() => {
    const s = sessionStorage.getItem("fifa_playoffs");
    return s ? JSON.parse(s) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state) {
      setLoading(true);
      apiGet("/api/fifa2026/playoffs/init")
        .then((res) => {
          if (res?.success) {
            sessionStorage.setItem("fifa_playoffs", JSON.stringify(res.state));
            setState(res.state);
          }
        })
        .catch((e) => {
          console.error("Failed loading playoffs init", e);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  async function submitMatchAuto(key, matchId, payload) {
    try {
      const body = {
        key,
        match_id: matchId,
        scoreA: payload.scoreA,
        scoreB: payload.scoreB,
        penaltyWinner: payload.penaltyWinner,
        teamA: payload.teamA,
        teamB: payload.teamB,
        state: state[key],
      };

      const res = await apiPost("/api/fifa2026/playoffs/predict_match", body);
      if (res?.success) {
        const updatedBlock =
          res.playoff || res.updated || (res.state && res.state[key]) || state[key];

        const next = { ...state, [key]: updatedBlock };
        sessionStorage.setItem("fifa_playoffs", JSON.stringify(next));
        setState(next);
      } else {
        console.warn("Failed to save match", res);
      }
    } catch (err) {
      console.error("submitMatch error", err);
    }
  }

  function renderRoundBlock(key, block, roundKey) {
    if (!block || !block[roundKey]) return null;

    return block[roundKey].map((m) => {
      const matchId = m.match || m.id || `${m.teamA}-${m.teamB}`;

      return (
        <Box key={matchId} sx={{ mb: 3 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              background: fifaTheme.background.panel,
              border: `1px solid ${fifaTheme.goldSoft}`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FifaFlag team={m.teamA} size={36} />
                <Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 800 }}>
                  {m.teamA}
                </Typography>
              </Box>

              <Box sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    color: fifaTheme.textMuted,
                    fontSize: 12,
                    textTransform: "uppercase",
                    mb: 1,
                  }}
                >
                  {roundKey}
                </Typography>

                {/* SCORES */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    type="number"
                    size="small"
                    value={m.scoreA ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setState((prev) => {
                        const copy = { ...prev };
                        ["round1", "semifinals", "final"].forEach((rk) => {
                          if (copy[key]?.[rk]) {
                            copy[key][rk] = copy[key][rk].map((itm) =>
                              (itm.match || itm.id) === matchId
                                ? { ...itm, scoreA: v }
                                : itm
                            );
                          }
                        });
                        return copy;
                      });

                      const other = m.scoreB ?? "";
                      if (other !== "" && other !== undefined) {
                        submitMatchAuto(key, matchId, {
                          teamA: m.teamA,
                          teamB: m.teamB,
                          scoreA: Number(v || 0),
                          scoreB: Number(other || 0),
                          penaltyWinner: m.penaltyWinner || "",
                        });
                      }
                    }}
                    sx={{ width: 80 }}
                  />

                  <TextField
                    type="number"
                    size="small"
                    value={m.scoreB ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setState((prev) => {
                        const copy = { ...prev };
                        ["round1", "semifinals", "final"].forEach((rk) => {
                          if (copy[key]?.[rk]) {
                            copy[key][rk] = copy[key][rk].map((itm) =>
                              (itm.match || itm.id) === matchId
                                ? { ...itm, scoreB: v }
                                : itm
                            );
                          }
                        });
                        return copy;
                      });

                      const other = m.scoreA ?? "";
                      if (other !== "" && other !== undefined) {
                        submitMatchAuto(key, matchId, {
                          teamA: m.teamA,
                          teamB: m.teamB,
                          scoreA: Number(other || 0),
                          scoreB: Number(v || 0),
                          penaltyWinner: m.penaltyWinner || "",
                        });
                      }
                    }}
                    sx={{ width: 80 }}
                  />
                </Box>

                {/* INLINE PENALTIES */}
                {String(m.scoreA) === String(m.scoreB) &&
                  String(m.scoreA) !== "" && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        select
                        size="small"
                        value={m.penaltyWinner || ""}
                        onChange={(e) => {
                          const v = e.target.value;

                          setState((prev) => {
                            const copy = { ...prev };
                            ["round1", "semifinals", "final"].forEach((rk) => {
                              if (copy[key]?.[rk]) {
                                copy[key][rk] = copy[key][rk].map((itm) =>
                                  (itm.match || itm.id) === matchId
                                    ? { ...itm, penaltyWinner: v }
                                    : itm
                                );
                              }
                            });
                            return copy;
                          });

                          submitMatchAuto(key, matchId, {
                            teamA: m.teamA,
                            teamB: m.teamB,
                            scoreA: Number(m.scoreA || 0),
                            scoreB: Number(m.scoreB || 0),
                            penaltyWinner: v,
                          });
                        }}
                        sx={{ minWidth: 220 }}
                      >
                        <option value=""></option>
                        <option value={m.teamA}>{m.teamA}</option>
                        <option value={m.teamB}>{m.teamB}</option>
                      </TextField>
                    </Box>
                  )}

                <Box sx={{ mt: 2 }}>
                  {m.winner && (
                    <Typography sx={{ color: fifaTheme.gold, fontWeight: 800 }}>
                      Winner: {m.winner}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ color: fifaTheme.textPrimary, fontWeight: 800 }}>
                  {m.teamB}
                </Typography>
                <FifaFlag team={m.teamB} size={36} />
              </Box>
            </Box>
          </Box>
        </Box>
      );
    });
  }

  if (loading) return <div className="p-8">Loading playoffs...</div>;
  if (!state) return <div className="p-8 text-white">No playoffs data.</div>;

  return (
    <Box sx={{ minHeight: "100vh", background: fifaTheme.background.base, p: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ color: fifaTheme.gold, fontWeight: 900, mb: 4 }}>
          Predict Playoffs
        </Typography>

        {Object.entries(state).map(([key, block]) => (
          <Box key={key} sx={{ mb: 6 }}>
            <Typography sx={{ color: fifaTheme.gold, fontWeight: 800, mb: 2 }}>
              {block.slot_name || key}
            </Typography>

            {renderRoundBlock(key, block, "round1")}
            {renderRoundBlock(key, block, "semifinals")}
            {renderRoundBlock(key, block, "final")}
          </Box>
        ))}

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            onClick={() => {
              const user_id = localStorage.getItem("username") || "guest";
              apiPost("/api/fifa2026/playoffs/commit_to_groups", {
                user_id,
                playoffs_state: state,
              })
                .then((res) => {
                  if (res?.success && res.state) {
                    sessionStorage.setItem("fifa_state", JSON.stringify(res.state));
                    sessionStorage.removeItem("fifa_playoffs");
                    navigate("/fifa/groups");
                  } else {
                    navigate("/fifa/groups");
                  }
                })
                .catch(() => navigate("/fifa/groups"));
            }}
            sx={{ background: fifaTheme.goldStrong, color: "#080808" }}
          >
            Continue to Group Stage
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
