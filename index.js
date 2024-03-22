require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { MongoClient } = require("mongodb");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("laptopify");
    const laptops = db.collection("laptops");

    app.listen(port, () => {
      console.log(`[server] running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (_req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };

  res.json(serverStatus);
});
