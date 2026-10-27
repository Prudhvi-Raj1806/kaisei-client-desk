const express = require("express");
const c = require("../controllers/projectController");

const router = express.Router();

router.get("/", c.listProjects); //              GET    /api/projects?status=&clientId=&sort=&order=
router.post("/", c.createProject); //            POST   /api/projects
router.get("/:id", c.getProject); //             GET    /api/projects/4
router.put("/:id", c.updateProject); //          PUT    /api/projects/4
router.patch("/:id/status", c.updateProjectStatus); // PATCH /api/projects/4/status
router.delete("/:id", c.deleteProject); //       DELETE /api/projects/4

module.exports = router;
