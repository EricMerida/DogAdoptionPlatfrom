const mongoose = require("mongoose");
const Dog = require("../models/Dog");

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || "10", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function createDog(req, res, next) {
  try {
    const { name, description } = req.body || {};
    if (!name || !description) return res.status(400).json({ error: "name and description required" });

    const dog = await Dog.create({
      name,
      description,
      owner: req.user.id,
    });

    return res.status(201).json(dog);
  } catch (err) {
    return next(err);
  }
}

async function adoptDog(req, res, next) {
  try {
    const { id } = req.params;
    const { thankYouMessage } = req.body || {};

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid dog id" });
    if (!thankYouMessage || thankYouMessage.trim().length === 0) {
      return res.status(400).json({ error: "thankYouMessage required" });
    }

    const dog = await Dog.findById(id);
    if (!dog) return res.status(404).json({ error: "dog not found" });

    if (dog.status === "adopted") return res.status(409).json({ error: "dog already adopted" });
    if (String(dog.owner) === String(req.user.id)) return res.status(403).json({ error: "cannot adopt your own dog" });

    dog.status = "adopted";
    dog.adopter = req.user.id;
    dog.thankYouMessage = thankYouMessage.trim();
    dog.adoptedAt = new Date();

    await dog.save();
    return res.json(dog);
  } catch (err) {
    return next(err);
  }
}

async function removeDog(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid dog id" });

    const dog = await Dog.findById(id);
    if (!dog) return res.status(404).json({ error: "dog not found" });

    if (String(dog.owner) !== String(req.user.id)) return res.status(403).json({ error: "not the owner" });
    if (dog.status === "adopted") return res.status(409).json({ error: "cannot remove an adopted dog" });

    await Dog.deleteOne({ _id: id });
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
}

async function listRegistered(req, res, next) {
  try {
    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { owner: req.user.id };
    if (status) {
      if (!["available", "adopted"].includes(status)) {
        return res.status(400).json({ error: "status must be available or adopted" });
      }
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      Dog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Dog.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    return next(err);
  }
}

async function listAdopted(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { adopter: req.user.id };

    const [items, total] = await Promise.all([
      Dog.find(filter).sort({ adoptedAt: -1 }).skip(skip).limit(limit),
      Dog.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createDog,
  adoptDog,
  removeDog,
  listRegistered,
  listAdopted,
};