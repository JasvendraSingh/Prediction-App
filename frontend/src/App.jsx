import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";

import FifaPlayoffs from "./pages/fifa2026/FifaPlayoffs.jsx";
import FifaGroupStage from "./pages/fifa2026/FifaGroupStage.jsx";
import FifaKnockouts from "./pages/fifa2026/FifaKnockouts.jsx";
import FifaWinner from "./pages/fifa2026/FifaWinner.jsx";

const App = () => {
  return (
    <Routes>
      {/* Main homepage */}
      <Route path="/" element={<HomePage />} />

      {/* FIFA — redirect base route */}
      <Route path="/fifa" element={<Navigate to="/fifa/playoffs" replace />} />

      {/* Actual FIFA flows */}
      <Route path="/fifa/playoffs" element={<FifaPlayoffs />} />
      <Route path="/fifa/groups" element={<FifaGroupStage />} />
      <Route path="/fifa/r32" element={<FifaKnockouts />} />
      <Route path="/fifa/knockouts" element={<FifaKnockouts />} />
      <Route path="/fifa/winner" element={<FifaWinner />} />

      {/* fallback */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export default App;
