require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/authRoutes");
const dogRoutes = require("./routes/dogRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/dogs", dogRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB(process.env.MONGO_URI);
  const port = process.env.PORT || 5050;
  app.listen(port, () => console.log(`🚀 Server listening on ${port}`));
}

if (require.main === module) start();

module.exports = app; // for testing