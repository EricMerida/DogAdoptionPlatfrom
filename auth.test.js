require("./setup");

const request = require("supertest");
const { expect } = require("chai");

const app = require("../app");

describe("Auth routes", function () {
  describe("POST /auth/register", function () {
    it("registers a new user", async function () {
      const res = await request(app)
        .post("/auth/register")
        .send({ username: "eric", password: "password123" });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("id");
      expect(res.body).to.have.property("username", "eric");
    });

    it("rejects duplicate usernames (409)", async function () {
      await request(app)
        .post("/auth/register")
        .send({ username: "eric", password: "password123" });

      const res2 = await request(app)
        .post("/auth/register")
        .send({ username: "eric", password: "newpass" });

      expect(res2.status).to.equal(409);
      expect(res2.body).to.have.property("error");
    });

    it("requires username and password (400)", async function () {
      const res = await request(app).post("/auth/register").send({ username: "x" });
      expect(res.status).to.equal(400);
    });
  });

  describe("POST /auth/login", function () {
    it("logs in and returns a token", async function () {
      await request(app)
        .post("/auth/register")
        .send({ username: "eric", password: "password123" });

      const res = await request(app)
        .post("/auth/login")
        .send({ username: "eric", password: "password123" });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("token");
      expect(res.body.token).to.be.a("string");
    });

    it("rejects invalid credentials (401)", async function () {
      await request(app)
        .post("/auth/register")
        .send({ username: "eric", password: "password123" });

      const res = await request(app)
        .post("/auth/login")
        .send({ username: "eric", password: "wrong" });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property("error");
    });
  });
});