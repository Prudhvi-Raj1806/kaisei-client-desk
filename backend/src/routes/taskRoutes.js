const express = require("express");
const c = require("../controllers/taskController");

const router = express.Router();

router.get("/", c.listTasks); //                GET    /api/tasks?projectId=&done=
router.post("/", c.createTask); //              POST   /api/tasks
router.get("/:id", c.getTask); //               GET    /api/tasks/7
router.put("/:id", c.updateTask); //            PUT    /api/tasks/7
router.patch("/:id/toggle", c.toggleTask); //   PATCH  /api/tasks/7/toggle
router.delete("/:id", c.deleteTask); //         DELETE /api/tasks/7

module.exports = router;
