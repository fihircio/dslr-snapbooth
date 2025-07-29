// Load environment variables from .env file
require('dotenv').config();

// Entry point for snapbooth-dslr-helper
const server = require('./api/server');

// Start the server
server.start();

