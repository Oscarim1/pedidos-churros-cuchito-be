const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

module.exports = app;
