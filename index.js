require('dotenv').config();
const express = require('express');
const { connectDB } = require('./configs/database');

const PORT = process.env.PORT || 3001;
const app = express();

require('./routers/middlewares/global.js')(app);
require('./routers/index.js')(app);
app.use(require('./routers/middlewares/error.js'));
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
