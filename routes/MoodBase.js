// routes/moodRoutes.js
const express = require("express");
const { getMoods } = require("../controllers/moodController");

const router = express.Router();

router.get("/", getMoods);

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: MoodBased Routes
 *   description: all MoodBased routes
 */

/**
 * @swagger
 * /api/Moodbasejourney:
 *   get:
 *     summary: Get all Moods by admin
 *     tags: [MoodBased Routes]
 *     responses:
 *       200:
 *         description: Success
 */



