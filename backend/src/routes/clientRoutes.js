const express = require("express");
const c = require("../controllers/clientController");

const router = express.Router();

router.get("/", c.listClients); //        GET    /api/clients?search=
router.post("/", c.createClient); //      POST   /api/clients
router.get("/:id", c.getClient); //       GET    /api/clients/3
router.put("/:id", c.updateClient); //    PUT    /api/clients/3
router.delete("/:id", c.deleteClient); // DELETE /api/clients/3

module.exports = router;
