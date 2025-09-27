import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const LeagueSelector = ({ league, setLeague }) => {
  const leagues = ['UEL', 'UCFL'];

  return (
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel id="league-select-label">Select League</InputLabel>
      <Select
        labelId="league-select-label"
        value={league}
        label="Select League"
        onChange={(e) => setLeague(e.target.value)}
      >
        {leagues.map((l) => (
          <MenuItem key={l} value={l}>
            {l}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LeagueSelector;
