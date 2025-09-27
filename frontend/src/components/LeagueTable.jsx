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
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Position</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Team</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>Points</TableCell>
            <TableCell sx={{ color: "white", fontWeight: 700 }}>GD</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((row, index) => (
            <TableRow key={index}>
              <TableCell sx={{ color: "white" }}>{index + 1}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.team}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.points}</TableCell>
              <TableCell sx={{ color: "white" }}>{row.gd}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeagueTable;
