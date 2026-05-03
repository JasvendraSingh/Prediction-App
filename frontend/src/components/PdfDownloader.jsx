import React from 'react';
import { Button } from '@mui/material';

const PdfDownloader = ({ leagueName, onDownload }) => {
  return (
    <Button variant="contained" color="primary" onClick={onDownload} sx={{ mt: 2 }}>
      Download {leagueName} PDF
    </Button>
  );
};

export default PdfDownloader;
