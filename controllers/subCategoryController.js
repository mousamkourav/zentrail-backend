const { uploadToCloudinary } = require("../middleware/multer");
const getPanelDb = require("../config/dbManager");

exports.migrateStatus = async (req, res) => {
  try {
    const { panel } = req.user;
    const { subCategory } = getPanelDb(panel);
    const result = await subCategory.updateMany(
      { status: { $exists: false } }, // jisme status field abhi nahi hai
      { $set: { status: "Published" } } // unme published set karo
    );
    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} documents updated to Published`,
    });
  } catch (err) {
    console.error(" Migration failed:", err);
  }
}

exports.createSubCategory = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { subCategory } = getPanelDb(panel);
    console.log(req);
    const {
      categoryId,
      uid,
      bannertitle,
      title,
      description,
      metaTitle,
      metaDescription,
      metaKeyword,
      imageAlt,
      status
    } = req.body;

    let imageUrl = "";
    let public_id = "";

    // Agar image upload ho rahi hai
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "subcategories");
      imageUrl = result.secure_url;
      public_id = result.public_id;
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

    const SubCategory = await subCategory.create({
      categoryId,
      uid,
      title,
      bannertitle,
      description,
      faq: faqData,
      metaTitle,
      metaDescription,
      metaKeyword,
      image: imageUrl,
      imagePublicId: public_id,
      imageAlt,
      status
    });

    res.status(201).json({ message: "subCategory created", SubCategory });
  } catch (err) {
    console.error("Error creating subcategory:", err);
    res.status(400).json({ error: err.message });
  }
};


exports.getAllSubCategories = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { subCategory } = getPanelDb(panel);

    const subCategories = await subCategory
      .find({ isDeleted: false })
      .populate("categoryId", 'name');

    res.status(200).json(subCategories);
  } catch (err) {
    console.error("Error fetching subcategories:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategoryById = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { subCategory } = getPanelDb(panel);

    const { id } = req.params;
    const SubCategory = await subCategory
      .findOne({ _id: id, isDeleted: false })
      .populate("categoryId", "name");

    if (!SubCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    res.status(200).json(SubCategory);
  } catch (err) {
    console.error("Error fetching subcategory:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategoryBySlug = async (req, res) => {
  console.log("get fetch")
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { subCategory } = getPanelDb(panel);

    const { slug } = req.params;

    const SubCategory = await subCategory
      .findOne({ uid: slug, isDeleted: false })
      .populate("categoryId", "name");

    if (!SubCategory) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    res.status(200).json(SubCategory);
  } catch (err) {
    console.error("Error fetching subcategory by slug (uid):", err);
    res.status(500).json({ error: err.message });
  }
};



// exports.getSubCategoryByCategoryId = async (req, res) => {
//   try {
//     const panel = req?.params?.panel || req?.user?.panel;
//     const { subCategory } = getPanelDb(panel);

//     const { slug } = req.params;
//     const SubCategory = await subCategory
//       .findOne({ uid: slug, isDeleted: false })
//       // .populate("categoryId", "name");

//     if (!SubCategory) {
//       return res.status(404).json({ message: "SubCategory not found" });
//     }

//     res.status(200).json(SubCategory);
//   } catch (err) {
//     console.error("Error fetching subcategory:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


exports.DeleteSubCategory = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { subCategory } = getPanelDb(panel);

    const { id } = req.params;

    const updated = await subCategory.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    res.status(200).json({ message: "SubCategory deleted", updated });
  } catch (err) {
    console.error("Error deleting subcategory:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { subCategory } = getPanelDb(panel);

    const { id } = req.params;
    const existingsubCategory = await subCategory.findOne({
      _id: id,
      // isActive: true,
    });
    const {
      categoryId,
      uid,
      title,
      bannertitle,
      description,
      faq,
      metaTitle,
      metaDescription,
      metaKeyword,
      imageAlt,
      status
    } = req.body;

    let updateData = {
      categoryId,
      uid,
      title,
      bannertitle,
      description,
      metaTitle,
      metaDescription,
      metaKeyword,
      imageAlt,
      status
    };


    if (faq) {
      try {
        updateData.faq = typeof faq === "string" ? JSON.parse(faq) : faq;
      } catch (err) {
        return res.status(400).json({ message: "Invalid FAQ format" });
      }
    }


    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "subcategories");
      updateData.image = result.secure_url;
      updateData.imagePublicId = result.public_id;
    }
    const allowedStatuses = ["Draft", "Published"];
    const newStatus = req.body.status || existingsubCategory.status;

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        message: "Invalid status. Allowed values are: Draft, Published.",
      });
    }
    if (existingsubCategory.status === "Published" && newStatus === "Draft") {
      return res.status(400).json({
        message: "A published Package cannot be reverted back to Draft.",
      });
    }

    existingsubCategory.status = newStatus;

    if (newStatus === "Published" && !existingsubCategory.publishedAt) {
      existingsubCategory.publishedAt = new Date();
    }

    const updated = await subCategory.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("categoryId", "title uid");

    if (!updated) {
      return res.status(404).json({ message: "SubCategory not found" });
    }

    res.status(200).json({ message: "SubCategory updated", updated });
  } catch (err) {
    console.error("Error updating subcategory:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getSubCategoriesByCategoryID = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { subCategory } = getPanelDb(panel);

    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    const subCategories = await subCategory
      .find({ categoryId, isDeleted: false })
      .populate("categoryId", "name");

    res.status(200).json(subCategories);
  } catch (err) {
    console.error("Error fetching subcategories by category:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategoriesByCategorySlug = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { Category, subCategory } = getPanelDb(panel);

    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ message: "Category slug is required" });
    }


    const category = await Category.findOne({ uid: slug, isDeleted: false });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subCategories = await subCategory
      .find({ categoryId: category._id, isDeleted: false })
      .populate("categoryId", "name uid");

    res.status(200).json(subCategories);
  } catch (err) {
    console.error("Error fetching subcategories by category slug:", err);
    res.status(500).json({ error: err.message });
  }
};
