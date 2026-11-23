

const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
const {upload} = require('../middleware/multer');
const getPanelDb = require('../config/dbManager');

router.get("/migrate/blogType", async (req, res) => {
  try {
    const panel = req.query.panel || req.user?.panel; // adjust as per your setup
    const { Blog } = getPanelDb(panel);

    const result = await Blog.updateMany(
      { type: { $exists: false } },
      { $set: { type: "blog" } }
    );

    res.json({
      success: true,
      message: "Migration complete",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


router.get('/all/:panel', blogController.getAllBlogs);
router.get('/:id/:panel', blogController.getBlogById);
router.get("/:panel/search/allblog", blogController.searchBlogs);



router.get('/comments/:blogId/:panel', blogController.getCommentsByBlog);
router.get('/comments/:commentId/replies/:panel', blogController.getAllRepliesByComment);

router.post('/comments/:commentId/like/:panel', blogController.likeComment);
router.post(
  "/comments/:commentId/reply/:replyId/like/:panel",

  blogController.likeReply);



router.use(protect);
router.get('/', blogController.getAllBlogs);    
router.get('/:id', blogController.getBlogById);
router.post('/', upload.single('featuredImage'), blogController.createBlog);
router.put('/:id', upload.single('featuredImage'), blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);



router.post('/comments/add/:panel', protect, blogController.addComment);
router.post('/comments/:commentId/reply/:panel', protect, blogController.addReplyToComment);

router.put('/comments/:commentId/:panel', protect, blogController.updateComment);
router.delete('/comments/:commentId/:panel', protect, blogController.deleteComment);

router.put(
  '/comments/:commentId/reply/:replyId/:panel',
  protect,
  blogController.updateReply
);

router.delete(
  '/comments/:commentId/reply/:replyId/:panel',
  protect,
  blogController.deleteReply
);


module.exports = router;





/**
 * @swagger
 * tags:
 *   name: Blog for admin control
 *   description: all blogs routes for admin
 */

/**
 * @swagger
 * tags:
 *   name: Blog for Users
 *   description: all blogs routes for user
 */


/////////////////////////// create blogs admin ////////////////////


/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: create a blog by admin
 *     tags: [Blog for admin control]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - uid
 *               - description
 *               - category
 *               - meta
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Top 10 Himalayan Treks"
 *               uid:
 *                 type: string
 *                 example: "top-10-himalayan-treks"
 *               description:
 *                 type: string
 *                 example: "This blog covers the best treks in the Himalayas..."
 *               authorName:
 *                 type: string
 *                 example: "John Doe"
 *               category:
 *                 type: string
 *                 description: Category ObjectId
 *                 example: "64b2fa2ac7e1b4567890abce"
 *               tags:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                 example: ["trekking", "himalayas", "adventure"]
 *               featuredImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                     example: "https://example.com/featured.jpg"
 *                   altText:
 *                     type: string
 *                     example: "Beautiful mountain"
 *               meta:
 *                 type: object
 *                 required:
 *                   - title
 *                   - description
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Top 10 Himalayan Treks"
 *                   description:
 *                     type: string
 *                     example: "SEO description for the blog"
 *                   keywords:
 *                     type: string
 *                     example: "trekking, himalayas"
 *                   canonicalUrl:
 *                     type: string
 *                     example: "https://example.com/blog/top-10-himalayan-treks"
 *               ogTags:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Top 10 Himalayan Treks"
 *                   description:
 *                     type: string
 *                     example: "Best trekking destinations in Himalayas"
 *                   image:
 *                     type: string
 *                     example: "https://example.com/og-image.jpg"
 *               status:
 *                 type: string
 *                 enum: [Draft, Published, Scheduled]
 *                 example: Published
 *               faq:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       example: "What is the best time for trekking?"
 *                     answer:
 *                       type: string
 *                       example: "April to June and September to November."
 *     responses:
 *       201:
 *         description: Created Successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */


/////////////////////////// edit blogs admin ////////////////////


/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: edit a blog by admin with passing _id of single blog
 *     tags: [Blog for admin control]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The blog id to update blog
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - uid
 *               - description
 *               - category
 *               - meta
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Top 10 Himalayan Treks"
 *               uid:
 *                 type: string
 *                 example: "top-10-himalayan-treks"
 *               description:
 *                 type: string
 *                 example: "This blog covers the best treks in the Himalayas..."
 *               authorName:
 *                 type: string
 *                 example: "John Doe"
 *               category:
 *                 type: string
 *                 description: Category ObjectId
 *                 example: "64b2fa2ac7e1b4567890abce"
 *               tags:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                 example: ["trekking", "himalayas", "adventure"]
 *               featuredImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                     example: "https://example.com/featured.jpg"
 *                   altText:
 *                     type: string
 *                     example: "Beautiful mountain"
 *               meta:
 *                 type: object
 *                 required:
 *                   - title
 *                   - description
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Top 10 Himalayan Treks"
 *                   description:
 *                     type: string
 *                     example: "SEO description for the blog"
 *                   keywords:
 *                     type: string
 *                     example: "trekking, himalayas"
 *                   canonicalUrl:
 *                     type: string
 *                     example: "https://example.com/blog/top-10-himalayan-treks"
 *               ogTags:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Top 10 Himalayan Treks"
 *                   description:
 *                     type: string
 *                     example: "Best trekking destinations in Himalayas"
 *                   image:
 *                     type: string
 *                     example: "https://example.com/og-image.jpg"
 *               status:
 *                 type: string
 *                 enum: [Draft, Published, Scheduled]
 *                 example: Published
 *               faq:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       example: "What is the best time for trekking?"
 *                     answer:
 *                       type: string
 *                       example: "April to June and September to November."
 *     responses:
 *       200:
 *         description: Updatet Successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */


/////////////////////////// get all blogs admin ////////////////////

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blog for admin control]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */

/////////////////////////// get single blogs by id admin ////////////////////

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get single blog by slug
 *     tags: [Blog for admin control]
*     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Blog Slug (MongoDB slug or UID)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */

/////////////////////////// delete blogs by id admin ////////////////////

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog by ID
 *     tags: [Blog for admin control]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID to delete
 *         example: "64b2fa2ac7e1b4567890abce"
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal Server Error
 */



/////////////////////////// get all blogs user ////////////////////

/**
 * @swagger
 * /api/blogs/all/{panel}:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blog for Users]
 *     parameters:
 *       - in: path
 *         name: panel
 *         required: true
 *         schema:
 *           type: string
 *         description: The panel Slug (like travel, event etc)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */


/////////////////////////// get single blogs user ////////////////////


/**
 * @swagger
 * /api/blogs/{id}/{panel}:
 *   get:
 *     summary: Get blog by ID and Panel
 *     tags: [Blog for Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *         type: string
 *         description: Blog unique identifier (ObjectId or UID)
 *         example: "64b2fa2ac7e1b4567890abce"
 *       - in: path
 *         name: panel
 *         required: true
 *         schema:
 *         type: string
 *         description: Panel identifier (dynamic param)
 *         example: "travel"
 *     responses:
 *       200:
 *         description: Blog fetched successfully
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal Server Error
 */




/**
 * @swagger
 * /api/blogs/{panel}/search/allblog:
 *   get:
 *     summary: Search blogs by title
 *     tags: [Blog for Users]
 *     parameters:
 *       - in: path
 *         name: panel
 *         required: true
 *         schema:
 *           type: string
 *         description: Panel identifier (dynamic param)
 *         example: "travel"
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword for blogs (title, description, tags, or category)
 *         example: "trekking"
 *     responses:
 *       200:
 *         description: Blogs fetched successfully

 *       400:
 *         description: Bad Request (missing query param)
 *       500:
 *         description: Internal Server Error
 */

// router.post('/:panel',inquiryController.createInquiry);