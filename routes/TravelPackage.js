
const express = require("express");
const router = express.Router();
const packageController = require("../controllers/TravelPackageController");

const { upload } = require("../middleware/multer");

router.get('/:panel/getalltravelpackage', packageController.getPackages);
router.get('/:panel/getalltravelpackage/:slug', packageController.getPackages);
router.get("/:panel/all-states", packageController.getAllStates);
router.get("/:panel/gallery/", packageController.getFilteredBasicPackages);
router.get("/:panel/gallery/:slug", packageController.getFilteredBasicPackages);
router.get("/:panel/packages/slug", packageController.getPackageBySlug);
router.get("/:panel/offbeat", packageController.getOffbeatPackages)

router.get("/:panel/subcategorygroup/:slug", packageController.getGroupedPackages);



const { protect } = require('../middleware/auth'); 

router.use(protect);
router.get("/:panel/migrate", packageController.migrateStatus);
router.post( "/",
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  packageController.createPackage
);

router.patch("/:id", 
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  packageController.updatePackage
);


router.delete("/soft-delete/:id", packageController.deletePackage);
// router.delete("/:panel/permanent-delete/:id", packageController.permanentDeletePackage);

router.get("/all", packageController.getAllPackages);
router.get("/active-false", packageController.getAllPackagesActiveFalse);
router.get("/tours", packageController.getAllTours);
router.get("/treks", packageController.getAllTreks);
router.get("/:id", packageController.getPackageById);
module.exports = router;

