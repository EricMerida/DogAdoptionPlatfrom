process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.PORT = process.env.PORT || "0"; // not used by supertest, but harmless

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

/**
 * Connect to in-memory MongoDB before tests run.
 */
before(async function () {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Use the same connection style your app uses (mongoose)
  await mongoose.connect(uri, {
    dbName: "dog_adoption_test",
  });
});

/**
 * Clear all collections between tests.
 */
beforeEach(async function () {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

/**
 * Disconnect and stop MongoMemoryServer after all tests.
 */
after(async function () {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

module.exports = {};