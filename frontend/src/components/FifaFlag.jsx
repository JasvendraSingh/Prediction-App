import React, { useState } from "react";
import COUNTRY_CODES from "../data/countryCodes.json";

const FALLBACK_IMG =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export default function FifaFlag({ team, size = 28 }) {
  const [error, setError] = useState(false);

  if (!team) return null;

  const key = team.trim().toLowerCase();

  const code =
    COUNTRY_CODES[team] ||
    COUNTRY_CODES[team.toLowerCase()] ||
    COUNTRY_CODES[
      Object.keys(COUNTRY_CODES).find(
        (k) => k.toLowerCase() === key
      )
    ];

  const url =
    code && !error
      ? `https://flagcdn.com/w40/${code}.png`
      : FALLBACK_IMG;

  return (
    <img
      src={url}
      onError={() => setError(true)}
      alt={team}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: 4,
        display: "inline-block"
      }}
    />
  );
}
