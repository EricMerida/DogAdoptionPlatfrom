require("./setup");

const request = require("supertest");
const { expect } = require("chai");
const app = require("../app");

async function registerAndLogin(username) {
  await request(app).post("/auth/register").send({ username, password: "pass12345" });
  const loginRes = await request(app).post("/auth/login").send({ username, password: "pass12345" });
  return loginRes.body.token;
}

describe("Dog routes", function () {
  it("requires auth for POST /dogs (401)", async function () {
    const res = await request(app).post("/dogs").send({ name: "Buddy", description: "Friendly" });
    expect(res.status).to.equal(401);
  });

  it("creates a dog (POST /dogs)", async function () {
    const token = await registerAndLogin("owner1");

    const res = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Buddy", description: "Friendly dog" });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("_id");
    expect(res.body).to.have.property("name", "Buddy");
    expect(res.body).to.have.property("status", "available");
  });

  it("prevents adopting your own dog (403)", async function () {
    const token = await registerAndLogin("owner1");

    const dogRes = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Max", description: "Good boy" });

    const adoptRes = await request(app)
      .post(`/dogs/${dogRes.body._id}/adopt`)
      .set("Authorization", `Bearer ${token}`)
      .send({ thankYouMessage: "Thanks!" });

    expect(adoptRes.status).to.equal(403);
  });

  it("adopts a dog successfully and stores thank you message", async function () {
    const ownerToken = await registerAndLogin("owner1");
    const adopterToken = await registerAndLogin("adopter1");

    const dogRes = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Luna", description: "Sweet and calm" });

    const adoptRes = await request(app)
      .post(`/dogs/${dogRes.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({ thankYouMessage: "We’ll give Luna a great home!" });

    expect(adoptRes.status).to.equal(200);
    expect(adoptRes.body).to.have.property("status", "adopted");
    expect(adoptRes.body).to.have.property("thankYouMessage");
    expect(adoptRes.body.thankYouMessage).to.include("great home");
    expect(adoptRes.body).to.have.property("adoptedAt");
  });

  it("prevents adopting an already adopted dog (409)", async function () {
    const ownerToken = await registerAndLogin("owner1");
    const adopterToken = await registerAndLogin("adopter1");
    const adopter2Token = await registerAndLogin("adopter2");

    const dogRes = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Charlie", description: "Playful" });

    await request(app)
      .post(`/dogs/${dogRes.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({ thankYouMessage: "Thank you!" });

    const adoptAgain = await request(app)
      .post(`/dogs/${dogRes.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopter2Token}`)
      .send({ thankYouMessage: "We also want Charlie!" });

    expect(adoptAgain.status).to.equal(409);
  });

  it("prevents non-owner from deleting a dog (403)", async function () {
    const ownerToken = await registerAndLogin("owner1");
    const otherToken = await registerAndLogin("notOwner");

    const dogRes = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Bella", description: "Gentle" });

    const delRes = await request(app)
      .delete(`/dogs/${dogRes.body._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(delRes.status).to.equal(403);
  });

  it("prevents deleting an adopted dog (409)", async function () {
    const ownerToken = await registerAndLogin("owner1");
    const adopterToken = await registerAndLogin("adopter1");

    const dogRes = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Rocky", description: "Energetic" });

    await request(app)
      .post(`/dogs/${dogRes.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({ thankYouMessage: "Thanks for Rocky!" });

    const delRes = await request(app)
      .delete(`/dogs/${dogRes.body._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(delRes.status).to.equal(409);
  });

  it("lists registered dogs with pagination and status filter", async function () {
    const ownerToken = await registerAndLogin("owner1");
    const adopterToken = await registerAndLogin("adopter1");

    // create 3 dogs
    const d1 = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "A", description: "A" });

    const d2 = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "B", description: "B" });

    await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "C", description: "C" });

    // adopt one dog
    await request(app)
      .post(`/dogs/${d1.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({ thankYouMessage: "Thanks!" });

    // filter adopted
    const adoptedList = await request(app)
      .get("/dogs/registered?status=adopted&page=1&limit=10")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(adoptedList.status).to.equal(200);
    expect(adoptedList.body).to.have.property("items");
    expect(adoptedList.body.items).to.be.an("array");
    expect(adoptedList.body.items.length).to.equal(1);
    expect(adoptedList.body.items[0]).to.have.property("status", "adopted");

    // pagination (limit 1)
    const page1 = await request(app)
      .get("/dogs/registered?page=1&limit=1")
      .set("Authorization", `Bearer ${ownerToken}`);

    const page2 = await request(app)
      .get("/dogs/registered?page=2&limit=1")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(page1.status).to.equal(200);
    expect(page1.body).to.include({ page: 1, limit: 1 });
    expect(page1.body.items).to.have.lengthOf(1);

    expect(page2.status).to.equal(200);
    expect(page2.body).to.include({ page: 2, limit: 1 });
    expect(page2.body.items).to.have.lengthOf(1);
  });

  it("lists adopted dogs with pagination", async function () {
    const ownerToken = await registerAndLogin("owner1");
    const adopterToken = await registerAndLogin("adopter1");

    const dogRes1 = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Dog1", description: "D1" });

    const dogRes2 = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Dog2", description: "D2" });

    await request(app)
      .post(`/dogs/${dogRes1.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({ thankYouMessage: "Thanks for Dog1!" });

    await request(app)
      .post(`/dogs/${dogRes2.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({ thankYouMessage: "Thanks for Dog2!" });

    const res = await request(app)
      .get("/dogs/adopted?page=1&limit=1")
      .set("Authorization", `Bearer ${adopterToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.include({ page: 1, limit: 1 });
    expect(res.body.items).to.be.an("array");
    expect(res.body.items.length).to.equal(1);
    expect(res.body).to.have.property("total", 2);
  });

  it("returns 400 on invalid dog id", async function () {
    const token = await registerAndLogin("user1");

    const res = await request(app)
      .post("/dogs/not-a-real-id/adopt")
      .set("Authorization", `Bearer ${token}`)
      .send({ thankYouMessage: "Thanks!" });

    expect(res.status).to.equal(400);
  });

  it("requires thankYouMessage when adopting (400)", async function () {
    const ownerToken = await registerAndLogin("owner1");
    const adopterToken = await registerAndLogin("adopter1");

    const dogRes = await request(app)
      .post("/dogs")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Milo", description: "Cute" });

    const res = await request(app)
      .post(`/dogs/${dogRes.body._id}/adopt`)
      .set("Authorization", `Bearer ${adopterToken}`)
      .send({}); // missing message

    expect(res.status).to.equal(400);
  });
});
