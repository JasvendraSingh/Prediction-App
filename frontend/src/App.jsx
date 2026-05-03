import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import FifaGroupStage from "./pages/fifa2026/FifaGroupStage.jsx";
import FifaKnockouts from "./pages/fifa2026/FifaKnockouts.jsx";
import FifaWinner from "./pages/fifa2026/FifaWinner.jsx";

const App = () => {
  return (
    <Routes>
      {/* Login / landing */}
      <Route path="/" element={<HomePage />} />

      {/* FIFA World Cup 2026 — base redirect to group stage */}
      <Route path="/fifa" element={<Navigate to="/fifa/groups" replace />} />

      {/* FIFA flows */}
      <Route path="/fifa/groups"    element={<FifaGroupStage />} />
      <Route path="/fifa/r32"       element={<FifaKnockouts />} />
      <Route path="/fifa/knockouts" element={<FifaKnockouts />} />
      <Route path="/fifa/winner"    element={<FifaWinner />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
