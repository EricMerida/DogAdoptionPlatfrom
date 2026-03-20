const express = require("express");
const router = express.Router();
const { authRequired } = require("../middlewares/auth");
const {
  createDog,
  adoptDog,
  removeDog,
  listRegistered,
  listAdopted,
} = require("../controllers/dogController");

router.use(authRequired);

router.post("/", createDog);
router.post("/:id/adopt", adoptDog);
router.delete("/:id", removeDog);

router.get("/registered", listRegistered);
router.get("/adopted", listAdopted);

module.exports = router;