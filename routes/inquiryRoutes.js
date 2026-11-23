

const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { protect } = require('../middleware/auth');
const multer = require("multer");
const path = require("path");


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

router.post("/upload-excel/:panel", upload.single("file"), inquiryController.uploadExcel);

router.get("/inquiry/:panel", inquiryController.migrateInquirySchema);  ///this is for update old data in case of new schema addedd
router.post('/:panel',inquiryController.createInquiry);
router.use(protect);
router.get("/", inquiryController.getAllInquiries);
router.put("/:id", inquiryController.updateInquiry);
module.exports = router;




/**
 * @swagger
 * tags:
 *   name: Inquery
 *   description: contact us form sumbittion
 */

///////////////////////// post single Inquery ///////////////////////////////


/**
 * @swagger
 * /api/inquiryform/travel:
 *   post:
 *     summary: Submit an inquiry
 *     tags: [Inquery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phoneNo:
 *                 type: string
 *                 example: "+91-9876543210"
 *               message:
 *                 type: string
 *                 example: I am interested in this trek package
 *               sourcePage:
 *                 type: string
 *                 example: /Zentrail contact us
 *               extraFields:
 *                 type: object
 *                 additionalProperties: true
 *                 example: { budget: "15000", groupSize: 4 }
 *     responses:
 *       201:
 *         description: Created Successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

///////////////////////// get all Inquery ///////////////////////////////

/**
 * @swagger
 * /api/inquiryform:
 *   get:
 *     summary: Get all inquiries
 *     tags: [Inquery]
 *     responses:
 *       200:
 *         description: Data fetched successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */




