require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { MongoClient } = require("mongodb");
const { ObjectId } = require("mongodb");

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

    app.get("/laptops", async (req, res) => {
      try {
        const { limit, brand, ratings, priceRange } = req.query;
        let query = {};

        if (brand) {
          query = {
            $or: brand.split(",").map((brand) => ({ brand })),
          };
        }

        if (priceRange) {
          const [min, max] = priceRange.split("-");
          query = {
            ...query,
            price: {
              $gte: parseFloat(min.trim().slice(1)),
              $lte: parseFloat(max.trim().slice(1)),
            },
          };
        }

        if (ratings) {
          query = {
            ...query,
            "ratings.average": {
              $gte: parseFloat(ratings),
              $lt: parseFloat(ratings) + 0.9,
            },
          };
        }

        const fetchedLaptops = await laptops
          .find(query)
          .limit(parseInt(limit) || 0)
          .toArray();

        if (fetchedLaptops) {
          return res.status(200).json(fetchedLaptops);
        }

        res.status(404).json({ message: "no laptops found" });
      } catch (error) {
        res.status(500).json({ message: "something went wrong" });
      }
    });

    app.get("/laptops/:laptopId", async (req, res) => {
      try {
        const laptopId = req.params.laptopId;

        const fetchedLaptop = await laptops.findOne({
          _id: new ObjectId(laptopId),
        });

        if (fetchedLaptop) {
          return res.status(200).json(fetchedLaptop);
        }

        res.status(404).json({ message: "no laptops found" });
      } catch (error) {
        res.status(500).json({ message: "something went wrong" });
      }
    });

    app.get("/flash-sales", async (req, res) => {
      try {
        const limit = req.query.limit;

        const fetchedLaptops = await laptops
          .find({ isOnFlashSale: true })
          .sort({ createdAt: -1 })
          .limit(parseInt(limit) || 0)
          .toArray();

        if (fetchedLaptops) {
          return res.status(200).json(fetchedLaptops);
        }

        res.status(404).json({ message: "no laptops found" });
      } catch (error) {
        res.status(500).json({ message: "something went wrong" });
      }
    });

    app.get("/trending", async (_req, res) => {
      try {
        const fetchedLaptops = await laptops
          .find({})
          .sort({ "ratings.average": -1 })
          .limit(8)
          .toArray();

        if (fetchedLaptops) {
          return res.status(200).json(fetchedLaptops);
        }

        res.status(404).json({ message: "no laptops found" });
      } catch (error) {
        res.status(500).json({ message: "something went wrong" });
      }
    });

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
