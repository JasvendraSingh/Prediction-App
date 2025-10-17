import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

const LeagueTable = ({ tableData }) => {
  if (!tableData || tableData.length === 0) {
    return (
      <Typography sx={{ color: "white", textAlign: "center", py: 2 }}>
        No standings available.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Pos</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Team</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Played</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Won</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Draw</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Lost</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>GD</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Points</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((row, index) => (
            <TableRow key={index}>
              <TableCell sx={{ color: "white" }}>{index + 1}</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 600 }}>{row.team}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.played}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.won}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.draw}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.lost}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.gd > 0 ? `+${row.gd}` : row.gd}</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeagueTable;