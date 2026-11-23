const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const {upload} = require('../middleware/multer');
const { protect } = require('../middleware/auth'); 
router.get('/:panel', portfolioController.getAllPortfolios);
router.post('/getPortfoliosByCategoryId/:panel', portfolioController.getPortfoliosByCategoryId);

router.use(protect);
router.post('/', upload.array('images', 10), portfolioController.createPortfolio);
router.get('/', portfolioController.getAllPortfolios);
router.get('/:id', portfolioController.getPortfolioById);
router.put('/:id', upload.array('images', 10), portfolioController.updatePortfolio);
router.delete('/:id', portfolioController.deletePortfolio);


module.exports = router;



/**
 * @swagger
 * tags:
 *   name: Portfolio Routes
 *   description: all Portfolio routes
 */

/////////////////////////// post portfilo image by adminn ////////////////////

/**
 * @swagger
 * /api/portfolio:
 *   post:
 *     summary: Create a new portfolio by admin
 *     tags: [Portfolio Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - images
 *             properties:
 *               category:
 *                 type: string
 *                 description: Category ID (ObjectId reference)
 *                 example: "64f1a2c5d5b8f3a7c9e1d2a2"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload up to 10 images
 *     responses:
 *       201:
 *         description: Portfolio created successfully
 *       400:
 *         description: Bad request (missing category or images)
 *       500:
 *         description: Server error
 */

/////////////////////////// get all portfilo image by adminn ////////////////////

/**
 * @swagger
 * /api/portfolio:
 *   get:
 *     summary: Get all category by user
 *     tags: [Portfolio Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */


/////////////////////////// get single portfolio to edit portfolio by admin ////////////////////

// /**
//  * @swagger
//  * /api/portfolio/{id}:
//  *   get:
//  *     summary: get single portfolio by admin
//  *     tags: [Portfolio Routes]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The category id to update category
//  *     responses:
//  *       200:
//  *         description: Category fetch successfully
//  *       400:
//  *         description: Bad Request
//  *       500:
//  *         description: Internal Server Error
//  */
