const { default: mongoose } = require("mongoose");
const getPanelDb = require("../config/dbManager");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../middleware/multer");
// const { Blog } = require("../models/dynamic");

exports.createServicePage = async (req, res) => {
  try {
    console.log("panel");
    const { panel } = req.user;
    const { servicePage } = getPanelDb(panel);
    let imageUrl = null;
    let public_id = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "servicepages");
      imageUrl = result.secure_url;
      public_id = result.public_id;
    }

    if (
      req.body.serviceCategory &&
      typeof req.body.serviceCategory === "string"
    ) {
      req.body.serviceCategory = req.body.serviceCategory
        .split(",")
        .map((id) => id.trim()) // remove spaces
        .filter(Boolean); // remove empty values
    }
    let faqData = [];
    if (req.body.faq) {
      try {
        faqData =
          typeof req.body.faq === "string"
            ? JSON.parse(req.body.faq)
            : req.body.faq;
      } catch (err) {
        console.error("Invalid FAQ format", err);
        return res.status(400).json({ message: "Invalid FAQ format" });
      }
    }
    let whyPoornamData = {};

    if (req.body.whyPoornam) {
      try {
        let parsed =
          typeof req.body.whyPoornam === "string"
            ? JSON.parse(req.body.whyPoornam)
            : req.body.whyPoornam;

        // ✅ If it's an array, take the first object
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed = parsed[0];
        }

        // ✅ Ensure it's an object with title & description
        whyPoornamData = {
          title: parsed.title || "",
          description: parsed.description || "",
        };
      } catch (err) {
        return res.status(400).json({ message: "Invalid whyPoornam format" });
      }
    }

    const page = new servicePage({
      ...req.body,
      faq: faqData,
      whyPoornam: whyPoornamData,
      featuredImage: {
        url: imageUrl,
        altText: req.body.featuredImageAltText || "",
      },
    });
    await page.save();
    const populatedPage = await servicePage
      .findById(page._id)
      .populate("serviceCategory", "name");

    res.status(201).json({ populatedPage });
  } catch (error) {
    console.error("Error creating service page:", error);
    res.status(500).json({ message: "Failed to create service page", error });
  }
};

exports.getAllServicePages = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { servicePage } = getPanelDb(panel);
    const pages = await servicePage
      .find({ isDeleted: false })
      .populate("serviceCategory", "name")
      .populate("blogcategory", "name")
      .populate("Portfolio", "name");

    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch service pages", error });
  }
};

// exports.getServicePageById = async (req, res) => {
//   try {
//     const panel = req.params.panel || req.user.panel;
//     const { servicePage, Blog, Category, Portfolio } = getPanelDb(panel);
//     const identifier = req.params.id;
//     let page = null;
//     if (mongoose.Types.ObjectId.isValid(identifier)) {
//       page = await servicePage
//         .findById(identifier)
//         .populate("serviceCategory" )
//     }
//     if (!page) {
//       page = await servicePage
//         .findOne({ uid: identifier })
//         .populate("serviceCategory" )
//     }

//     console.log(page)
//     if (!page) {
//       return res.status(404).json({ message: "Service page not found" });
//     }
//     console.log(page);
//     const categoryIds = Array.isArray(page.blogcategory)
//       ? page.blogcategory.map((c) => c._id.toString())
//       : [page.blogcategory._id.toString()];

//     const blogs = await Blog.find({
//       category: categoryIds,
//     }).populate("category", "name");

//     const portfolioCategoryIds = Array.isArray(page.Portfolio)
//       ? page.Portfolio.map((p) => p._id.toString())
//       : [page.Portfolio._id.toString()];

//     const relatedPortfolios = await Portfolio.find({
//       category: portfolioCategoryIds,
//     }).populate("category", "name");

//     // console.log(relatedPortfolios);
//     res.status(200).json({
//       ...page.toObject(),
// relatedBlogs: blogs,
// relatedPortfolios: relatedPortfolios,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch service page", error });
//   }
// };

// // Update a service page

exports.getServicePageById = async (req, res) => {
  try {
    const panel = req.params.panel || req.user.panel;
    const { servicePage, Blog, Category, Portfolio } = getPanelDb(panel);
    const identifier = req.params.id;
    let page = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      page = await servicePage
        .findById({
          _id: identifier,
          isDeleted: false,
        })
        .populate("serviceCategory")
        .populate("blogcategory");
    }
    if (!page) {
      page = await servicePage
        .findOne({
          uid: identifier,
          isDeleted: false,
        })
        .populate("serviceCategory")
        .populate("blogcategory");
    }

    if (!page) {
      return res.status(404).json({ message: "Service page not found" });
    }

    const categoryIds = Array.isArray(page.blogcategory)
      ? page.blogcategory.map((c) => c._id.toString())
      : [page.blogcategory._id.toString()];

    const blogs = await Blog.find({
      category: categoryIds,
    }).populate("category", "name");

    const portfolioCategoryIds = Array.isArray(page.Portfolio)
      ? page.Portfolio.map((p) => p._id.toString())
      : [page.Portfolio._id.toString()];

    const relatedPortfolios = await Portfolio.find({
      category: portfolioCategoryIds,
    }).populate("category", "name");

    res.status(200).json({
      ...page.toObject(),
      relatedBlogs: blogs,
      relatedPortfolios: relatedPortfolios,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch service page", error });
  }
};

exports.updateServicePageById = async (req, res) => {
  try {
    const { panel } = req.user;
    const { servicePage } = getPanelDb(panel);
    console.log(servicePage);
    const pageId = req.params.id;
    const existingPage = await servicePage.findById({
      _id: pageId,
      isDeleted: false,
    });
    if (!existingPage) {
      return res.status(404).json({ message: "Service page not found" });
    }

    let imageUrl = existingPage.featuredImage?.url || null;
    let public_id = existingPage.featuredImage?.public_id || "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "servicepages");
      imageUrl = result.secure_url;
      public_id = result.public_id;
    }

    if (
      req.body.serviceCategory &&
      typeof req.body.serviceCategory === "string"
    ) {
      req.body.serviceCategory = req.body.serviceCategory
        .split(",")
        .map((id) => id.trim()) // remove spaces
        .filter(Boolean); // remove empty values
    }
    let faqData = existingPage.faq || [];

    if (req.body.faq) {
      try {
        faqData =
          typeof req.body.faq === "string"
            ? JSON.parse(req.body.faq)
            : req.body.faq;
      } catch (err) {
        console.error("Invalid FAQ format", err);
        return res.status(400).json({ message: "Invalid FAQ format" });
      }
    }
    let whyPoornamData = existingPage.whyPoornam || [];
    if (req.body.whyPoornam) {
      try {
        whyPoornamData =
          typeof req.body.whyPoornam === "string"
            ? JSON.parse(req.body.whyPoornam)
            : req.body.whyPoornam;
      } catch (err) {
        console.error("Invalid whyPoornam format", err);
        return res.status(400).json({ message: "Invalid whyPoornam format" });
      }
    }

    const updatedData = {
      ...req.body,
      faq: faqData,
      whyPoornam: whyPoornamData,
      featuredImage: {
        url: imageUrl,
        altText:
          req.body.featuredImage?.AltText ||
          existingPage.featuredImage?.altText || req.body.featuredImageAltText  ||
          "",
        public_id,
      },
    };

    const updatedPage = await servicePage
      .findByIdAndUpdate(pageId, updatedData, { new: true })
      .populate("serviceCategory", "name")
      .populate("blogcategory", "name")
      .populate("Portfolio", "name");

    res.status(200).json({ updatedPage });
  } catch (error) {
    console.error("Error updating service page:", error);
    res.status(500).json({ message: "Failed to update service page", error });
  }
};

exports.deleteServicePageById = async (req, res) => {
  try {
    const { panel } = req.user;
    const { servicePage } = getPanelDb(panel);

    const pageId = req.params.id;

    const page = await servicePage.findOne({ _id: pageId, isDeleted: false });
    if (!page) {
      return res
        .status(404)
        .json({ message: "Service page not found or already deleted" });
    }

    const publicId = page.featuredImage?.public_id;
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    page.isDeleted = true;
    await page.save();

    res
      .status(200)
      .json({ message: "Service page deleted successfully (soft delete)" });
  } catch (error) {
    console.error("Error deleting service page:", error);
    res.status(500).json({ message: "Failed to delete service page", error });
  }
};
