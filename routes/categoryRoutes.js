const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getBlogCategories,
  getNonBlogCategories
} = require("../controllers/categoryController");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/multer");

router.get("/getuserpanel/:panel", getCategories);
router.get("/:panel/blog-categories", getBlogCategories);
router.get("/:panel/non-blog-categories", getNonBlogCategories);

router.use(protect);

router.get("/blog-categories", getBlogCategories);
router.get("/non-blog-categories", getNonBlogCategories);

router.post("/", upload.single("image"), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Category Routes
 *   description: all Category routes for admin
 */
/////////////////////////// get all category by user ////////////////////

/**
 * @swagger
 * /api/category/getuserpanel/{panel}:
 *   get:
 *     summary: Get all category by user
 *     tags: [Category Routes]
*     parameters:
 *       - in: path
 *         name: panel
 *         required: true
 *         schema:
 *           type: string
 *         description: The panel slug 
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */


/////////////////////////// create Categogry by admin ////////////////////

/**
 * @swagger
 * /api/category:
 *   post:
 *     summary: Create a new category by admin
 *     tags: [Category Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique category name (stored in lowercase)
 *                 example: "For Peace & Calm"
 *               description:
 *                 type: string
 *                 example: "Serene valleys, quiet forests, digital detox escapes."
 *               metaTitle:
 *                 type: string
 *                 example: "For Peace & Calm"
 *               metaDescription:
 *                 type: string
 *                 example: "For Peace & Calm"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Upload category image
 *               isDeleted:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

/////////////////////////// edit Categogry by admin ////////////////////

/**
 * @swagger
 * /api/category/{id}:
 *   put:
 *     summary: edit a single category by admin
 *     tags: [Category Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category id to update category
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique category name (stored in lowercase)
 *                 example: "For Peace & Calm"
 *               description:
 *                 type: string
 *                 example: "Serene valleys, quiet forests, digital detox escapes."
 *               metaTitle:
 *                 type: string
 *                 example: "For Peace & Calm"
 *               metaDescription:
 *                 type: string
 *                 example: "For Peace & Calm"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Upload category image
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

/////////////////////////// get single catgory to edit Categogry by admin ////////////////////

/**
 * @swagger
 * /api/category/{id}:
 *   get:
 *     summary: get single by admin
 *     tags: [Category Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category id to update category
 *     responses:
 *       200:
 *         description: Category fetch successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */

/////////////////////////// get all category admin ////////////////////

/**
 * @swagger
 * /api/category:
 *   get:
 *     summary: Get all category by admin
 *     tags: [Category Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */


/////////////////////////// delete category by id admin ////////////////////

/**
 * @swagger
 * /api/category/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Category Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: category ID to delete
 *         example: "64b2fa2ac7e1b4567890abce"
 *     responses:
 *       200:
 *         description: category deleted successfully
 *       404:
 *         description: category not found
 *       500:
 *         description: Internal Server Error
 */