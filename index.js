const express = require("express");
const app = express();
const PORT = process.env.PORT || 3002;
const bodyParser = require("body-parser");
const cors = require('cors');
app.use(cors({
    origin: ['http://localhost:3000']
}));
app.use(bodyParser.json());

require("./routes")(app);
require("./db");

//this will catch any route that doesn't exist
app.get("*", (req, res) => {
  res.status(404).json("Sorry, page not found");
});

app.listen(PORT, () => {
  console.log("I am listening to port:", PORT);
});
