const mongoose = require("mongoose");
const db = mongoose.connection;

//Environment Variables
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/testDB";

//connect to Mongo
const connectDB = async () => {
  const dbConnection = await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  if (dbConnection.connections) {
    console.log("mongodb connected");
  }
};

//Error/Disconnection
db.on("error", (err) => console.log(err.message + " is Mongod not running?"));
db.on("disconnected", () => console.log("mongo disconnected"));
connectDB();
