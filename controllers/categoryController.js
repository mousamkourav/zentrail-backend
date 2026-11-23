const getPanelDb = require("../config/dbManager");
const { uploadToCloudinary } = require("../middleware/multer");

exports.createCategory = async (req, res) => {
  try {
    const { panel } = req.user;
    const { Category } = getPanelDb(panel);
    const {
      name,
      bannertitle,
      uid,
      description,
      metaTitle,
      metaDescription,
      isblog,
      metaKeyword,
      imageAlt
    } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    let imageUrl = "";
    let public_id = "";
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

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "categories");
      imageUrl = result.secure_url;
      public_id = result.public_id;
    }

    const category = await Category.create({
      name,
      bannertitle,
      uid,
      description,
      metaTitle,
      metaDescription,
      metaKeyword,
      image: imageUrl,
      imagePublicId: public_id,
      faq: faqData,
      isblog,
      imageAlt
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { Category } = getPanelDb(panel);

    const categories = await Category.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
   

    if (!categories) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { panel } = req.user;
    // const panel = req.params.panel || req.user?.panel;
    const { Category } = getPanelDb(panel);

    const categories = await Category.find({ _id: id, isDeleted: false }).sort({
      createdAt: -1,
    });
    if (!categories) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(categories);
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({ message: "Failed to fetch category" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { panel } = req.user;
    
    const { Category } = getPanelDb(panel);
    

    const { name, bannertitle, description, metaTitle, metaDescription,isblog ,imageAlt} = req.body;

    const category = await Category.findById({ _id: id, isDeleted: false });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (req.file) {
      if (category.imagePublicId) {
        await deleteFromCloudinary(category.imagePublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer, "categories");
      category.image = result.secure_url;
      category.imagePublicId = result.public_id;
    }
    if (req.body?.faq) {
      try {
        category.faq = typeof req.body.faq === "string"
          ? JSON.parse(req.body.faq)
          : req.body.faq;
      } catch (err) {
        return res.status(400).json({ message: "Invalid FAQ format" });
      }
    }

    // Update other fields
    category.name = name || category.name;
    category.bannertitle = bannertitle || category.bannertitle;
    category.description = description || category.description;
    category.metaTitle = metaTitle || category.metaTitle;
    category.metaDescription = metaDescription || category.metaDescription;
    category.isblog=isblog
    category.imageAlt=imageAlt
    

    await category.save();

    res.json(category);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Failed to update category" });
  }
};

// ✅ Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { panel } = req.user;
    const { Category } = getPanelDb(panel);

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete image from Cloudinary if exists
    if (category.imagePublicId) {
      await deleteFromCloudinary(category.imagePublicId);
    }

    category.isDeleted = true;
    await category.save();

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

exports.getBlogCategories = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { Category } = getPanelDb(panel);

    const categories = await Category.find({ isDeleted: false, isblog: true }).sort({ createdAt: -1 });

    res.json(categories);
  } catch (err) {
    console.error("Error fetching blog categories:", err);
    res.status(500).json({ message: "Failed to fetch blog categories" });
  }
};

exports.getNonBlogCategories = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { Category } = getPanelDb(panel);

    const categories = await Category.find({ isDeleted: false, isblog: false }).sort({ createdAt: -1 });

    res.json(categories);
  } catch (err) {
    console.error("Error fetching non-blog categories:", err);
    res.status(500).json({ message: "Failed to fetch non-blog categories" });
  }
};

