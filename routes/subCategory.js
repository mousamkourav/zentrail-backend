const express = require("express");
const router = express.Router();
const {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  DeleteSubCategory,
  updateSubCategory,
  getSubCategoryByCategoryId,
  getSubCategoriesByCategoryID,
  getSubCategoriesByCategorySlug,
  getSubCategoryBySlug,
  migrateStatus

} = require("../controllers/subCategoryController");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/multer");


// router.get("/getuserpanel/:slug/:panel", getSubCategoryByCategoryId);

router.get('/:panel/id/:categoryId', getSubCategoriesByCategoryID)
router.get('/:panel/slug/:slug', getSubCategoriesByCategorySlug);

router.get("/:panel/:slug", getSubCategoryBySlug);
router.use(protect);
router.get("/migratesubcategory", migrateStatus);
router.post("/", upload.single("image"), createSubCategory);

router.get("/", getAllSubCategories);

router.get("/:id", getSubCategoryById);

router.put("/:id", upload.single("image"), updateSubCategory);

router.delete("/:id", DeleteSubCategory);

module.exports = router;
