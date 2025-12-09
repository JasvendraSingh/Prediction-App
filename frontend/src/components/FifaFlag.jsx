import React, { useState } from "react";

const FALLBACK_IMG =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export default function FifaFlag({ team, size = 28 }) {
  const [error, setError] = useState(false);

  if (!team) return null;

  const slug = team
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/’/g, "")
    .replace(/'/g, "")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

  const url = !error ? `https://flagcdn.com/w40/${slug}.png` : FALLBACK_IMG;

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
        backgroundColor: "transparent",
        display: "inline-block",
      }}
    />
  );
}
