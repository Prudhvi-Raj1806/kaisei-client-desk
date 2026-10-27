const express = require("express");
const c = require("../controllers/invoiceController");

const router = express.Router();

router.get("/", c.listInvoices); //               GET    /api/invoices?status=&projectId=
router.post("/", c.createInvoice); //             POST   /api/invoices
router.patch("/:id/mark-paid", c.markInvoicePaid); // PATCH /api/invoices/6/mark-paid
router.patch("/:id/void", c.voidInvoice); //      PATCH  /api/invoices/6/void
router.delete("/:id", c.deleteInvoice); //        DELETE /api/invoices/6

module.exports = router;
