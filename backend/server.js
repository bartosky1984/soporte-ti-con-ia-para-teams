// REFERENCE ONLY: This file contains the backend code requested by the user.
// In the preview environment, the frontend uses the ticketService mock.

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3978;

app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files
app.use('/tab', express.static(path.join(__dirname, '../src/tab')));

// API Endpoints

// GET /api/tickets - Get all tickets
app.get('/api/tickets', (req, res) => {
  const sql = "SELECT * FROM tickets ORDER BY fecha DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({"error": err.message});
      return;
    }
    res.json(rows);
  });
});

// POST /api/tickets - Create a new ticket
app.post('/api/tickets', (req, res) => {
  const { tipo, descripcion } = req.body;
  if (!tipo || !descripcion) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  
  const sql = 'INSERT INTO tickets (tipo, descripcion) VALUES (?, ?)';
  const params = [tipo, descripcion];
  
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    
    // Return the created object
    db.get("SELECT * FROM tickets WHERE id = ?", [this.lastID], (err, row) => {
        res.status(201).json(row);
    });
  });
});

// PUT /api/tickets/:id - Update ticket status
app.put('/api/tickets/:id', (req, res) => {
  const { estado } = req.body;
  const sql = `UPDATE tickets SET estado = ? WHERE id = ?`;
  const params = [estado, req.params.id];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({
      message: "success",
      changes: this.changes
    });
  });
});

// Start HTTPS Server (Required for Teams)
// Note: In a real dev environment, you need valid SSL certs.
// For localhost, you might use self-signed certs.
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')), // Placeholder
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')) // Placeholder
};

// Fallback to HTTP if certs missing for demo code structure validty
try {
    https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`Teams Ticket App Server running on https://localhost:${PORT}`);
    });
} catch (e) {
    console.log("SSL Certs not found, starting in HTTP mode for testing (Teams requires HTTPS)");
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
