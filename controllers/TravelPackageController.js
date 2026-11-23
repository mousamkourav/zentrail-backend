
const getPanelDb = require("../config/dbManager");
const { uploadToCloudinary } = require("../middleware/multer");

const getMoodData = require("../utils/moodhandler")

exports.migrateStatus = async (req, res) => {
  try {
    const { panel } = req.user;
    const { TravelPackage } = getPanelDb(panel);
    const result = await TravelPackage.updateMany(
      { status: { $exists: false } }, // jisme status field abhi nahi hai
      { $set: { status: "Published" } } // unme published set karo
    );
    console.log(` Updated ${result.modifiedCount} documents to Published`);
    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} documents updated to Published`,
    });
  } catch (err) {
    console.error(" Migration failed:", err);
  }
}

exports.createPackage = async (req, res) => {
  try {
    const { panel } = req.user; // ✅ user se panel nikala
    const { TravelPackage } = getPanelDb(panel); // ✅ us panel ka Package model

    let featuredImage = { url: "", alt: "" };
    let gallery = [];
    let faqData = [];
    let batchesdata = [];
    // let groupMembers = [];
    let itinerary = [];
    let moodOfJourney = [];
    let seo = JSON.parse(req.body.seo)
    if (req.body.moodOfJourney) {
      const moodTitle = typeof req.body.moodOfJourney === "string"
        ? JSON.parse(req.body.moodOfJourney).title
        : req.body.moodOfJourney.title;

      const moodData = getMoodData(moodTitle);
      if (!moodData) {
        return res.status(400).json({ message: "Invalid mood title" });
      }
      moodOfJourney = moodData;
    }
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
    if (req.body.batches) {
      try {
        batchesdata =
          typeof req.body.batches === "string"
            ? JSON.parse(req.body.batches)
            : req.body.batches;
      } catch (err) {
        console.error("Invalid batches format", err);
        return res.status(400).json({ message: "Invalid batches format" });
      }
    }

    // ✅ Featured Image (single)
    if (req.files && req.files.featuredImage) {
      const file = req.files.featuredImage[0];
      const result = await uploadToCloudinary(file.buffer, "packages");
      featuredImage = {
        url: result.secure_url,
        alt: req.body.featuredAlt || "",
      };
    }

    // ✅ Gallery Images (multiple)
    if (req.files && req.files.gallery) {
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, "packages");
        gallery.push({
          url: result.secure_url,
          alt: req.body[`galleryAlt_${file.name}`] || "",
        });
      }
    }
    if (typeof req.body.groupMembers === "string") {
      try {
        req.body.groupMembers = JSON.parse(req.body.groupMembers);
      } catch (err) {
        return res.status(400).json({ message: "Invalid groupMembers format" });
      }
    }
    if (req.body.itinerary) {
      try {
        itinerary = JSON.parse(req.body.itinerary);
      } catch (err) {
        console.error("Invalid itinerary JSON:", err);
      }
    }
    let discount = {};
    if (req.body.discount) {
      try {
        discount =
          typeof req.body.discount === "string"
            ? JSON.parse(req.body.discount)
            : req.body.discount;
      } catch (err) {
        console.error("Invalid discount format", err);
        return res.status(400).json({ message: "Invalid discount format" });
      }
    }

    const packageData = {
      ...req.body,
      id: req.params.id,
      faq: faqData,
      featuredImage,
      batches: batchesdata,
      gallery,
      itinerary,
      discount,
      // groupMembers,
      moodOfJourney,
      seo
    };

    const Package = new TravelPackage(packageData);
    await Package.save();

    res.status(201).json({
      message: "Package createdPackage successfully",
      data: Package,
    });
  } catch (err) {
    console.error("Create Package Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPackages = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { TravelPackage } = getPanelDb(panel);

    const { slug } = req.params;
    const {
      type,
      duration,
      minprice,
      maxprice,
      page = 1,
      limit = 6,
    } = req.query;

    const filter = {isActive:true,status: "Published"};

    if (slug) {
      const rawSlug = decodeURIComponent(slug).trim().toLowerCase();

      const moodSlugMap = {
        "peace-and-calm": "Peace & Calm",
        "exploration": "Exploration",
        "for-adventure": "For Adventure",
        "digital-detox": "Digital Detox",
        "curiosity": "Curiosity",

      };

      const seasons = ["summer-trips", "winter-trips", "autumn-trips", "monsoon-trips"];
      const moodTitle = moodSlugMap[rawSlug];

      if (seasons.includes(rawSlug)) {
        filter.season = new RegExp(`^${rawSlug}$`, "i");
      } else if (moodTitle) {
        filter["moodOfJourney.title"] = new RegExp(`^${moodTitle}$`, "i");
      } else {

        const stateName = rawSlug.replace(/-/g, ' ');
        filter.state = new RegExp(`^${stateName}$`, "i");
      }
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (minprice || maxprice) {
      filter.price = {};
      if (minprice) filter.price.$gte = parseFloat(minprice);
      if (maxprice) filter.price.$lte = parseFloat(maxprice);
    }

    if (duration) {
      const allPackages = await TravelPackage.find(
        {},
        { slug: 1, duration: 1 }
      );

      const matchingSlugs = allPackages
        .map((pkg) => {
          const match = pkg.duration?.trim().match(/(\d+)\s*D/i);
          const days = match ? parseInt(match[1], 10) : null;
          return days ? { slug: pkg.slug, days } : null;
        })
        .filter(Boolean)
        .filter((pkg) => {
          if (duration === "1-3") return pkg.days >= 1 && pkg.days <= 3;
          if (duration === "4-6") return pkg.days >= 4 && pkg.days <= 6;
          if (duration === "7-10") return pkg.days >= 7 && pkg.days <= 10;
          if (duration === "10+") return pkg.days >= 10;
          return false;
        })
        .map((pkg) => pkg.slug);

      if (matchingSlugs.length > 0) {
        filter.slug = { $in: matchingSlugs };
      } else {
        return res.status(200).json({
          message: "No packages found for selected duration",
          count: 0,
          total: 0,
          currentPage: parseInt(page),
          totalPages: 0,
          data: [],
        });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await TravelPackage.countDocuments(filter);

    const packages = await TravelPackage.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("  id type title  slug price discount featuredImage season locationAddress  state duration groupMembers metaTitle metaDescription ");

    res.status(200).json({
      message: "Packages fetched successfully",
      count: packages.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: packages,
    });
  } catch (err) {
    console.error("Get Packages Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPackageBySlug = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { TravelPackage } = getPanelDb(panel);

    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ message: "Slug is required" });
    }

    const packageData = await TravelPackage.findOne({ slug });

    if (!packageData) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.status(200).json({
      message: "Package fetched successfully",
      data: packageData,
    });
  } catch (err) {
    console.error("Get Package By Slug Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllStates = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { TravelPackage } = getPanelDb(panel);

    const states = await TravelPackage.distinct("state");

    res.status(200).json({
      message: "All unique states fetched successfully",
      states: states.filter(Boolean),
    });
  } catch (err) {
    console.error("Get All States Error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getFilteredBasicPackages = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { TravelPackage } = getPanelDb(panel);

    const { slug } = req.params;
    const { type, page = 1 } = req.query;

    const limit = 8;
    const skip = (parseInt(page) - 1) * limit;

    const filter = {};


    if (slug) {
      const rawSlug = decodeURIComponent(slug).trim().toLowerCase();

      const moodSlugMap = {
        "peace-and-calm": "Peace & Calm",
        "exploration": "Exploration",
        "for-adventure": "For Adventure",
        "digital-detox": "Digital Detox",
        "curiosity": "Curiosity",

      };

      const seasons = ["summer-trips", "winter-trips", "autumn-trips", "monsoon-trips"];
      const moodTitle = moodSlugMap[rawSlug];

      if (seasons.includes(rawSlug)) {
        filter.season = new RegExp(`^${rawSlug}$`, "i");
      } else if (moodTitle) {
        filter["moodOfJourney.title"] = new RegExp(`^${moodTitle}$`, "i");
      } else {

        const stateName = rawSlug.replace(/-/g, ' ');
        filter.state = new RegExp(`^${stateName}$`, "i");
      }
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    const packages = await TravelPackage.find(filter)
      .select("title slug gallery")
      .sort({ updatedAt: -1 });

    const allGalleryImages = [];

    for (const pkg of packages) {
      (pkg.gallery || []).forEach((img) => {
        allGalleryImages.push({
          ...img.toObject(),
          packageId: pkg._id,
          title: pkg.title,
          slug: pkg.slug,
        });
      });
    }

    const totalImages = allGalleryImages.length;
    const paginatedImages = allGalleryImages.slice(skip, skip + limit);

    res.status(200).json({
      message: "Gallery images fetched successfully",
      total: totalImages,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalImages / limit),
      count: paginatedImages.length,
      data: paginatedImages,
    });
  } catch (err) {
    console.error("Gallery Images Error:", err);
    res.status(500).json({ message: err.message });
  }
};




exports.updatePackage = async (req, res) => {
  try {
    const { panel } = req.user;

    const { TravelPackage } = getPanelDb(panel);
    const { id } = req.params;
    let itinerary = [];

    if (!req.body || typeof req.body !== "object") {
      req.body = {};
    }
    const existingPackage = await TravelPackage.findOne({
      _id: id,
      // isActive: true,
    });
    if (!existingPackage) {
      return res.status(404).json({ message: "Package not found" });
    }
    if (req.body.itinerary) {
      try {
        itinerary = JSON.parse(req.body.itinerary);
      } catch (err) {
        console.error("Invalid itinerary JSON:", err);
      }
    }

    let faqData = req.body?.faq;
    if (faqData && typeof faqData === "string") {
      try {
        faqData = JSON.parse(faqData);
      } catch (e) {
        return res.status(400).json({ message: "Invalid FAQ format" });
      }
    }
    let batchesData = req.body?.batches;
    if (batchesData && typeof batchesData === "string") {
      try {
        batchesData = JSON.parse(batchesData);
      } catch (e) {
        return res.status(400).json({ message: "Invalid FAQ format" });
      }
    }

    let discountData = req.body?.discount;
    if (discountData && typeof discountData === "string") {
      try {
        discountData = JSON.parse(discountData);
      } catch (e) {
        return res.status(400).json({ message: "Invalid discount format" });
      }
    }
    let seoData = req.body?.seo;
    if (seoData && typeof seoData === "string") {
      try {
        seoData = JSON.parse(seoData);
      } catch (e) {
        return res.status(400).json({ message: "Invalid SEO format" });
      }
    }

    let groupMembersData = req.body?.groupMembers;
    if (groupMembersData && typeof groupMembersData === "string") {
      try {
        groupMembersData = JSON.parse(groupMembersData);
      } catch (e) {
        return res.status(400).json({ message: "Invalid groupMembers format" });
      }
    }

    if (req.files?.featuredImage) {
      const file = req.files.featuredImage[0];
      const result = await uploadToCloudinary(file.buffer, "packages");
      existingPackage.featuredImage = {
        url: result.secure_url,
        alt: req.body.featuredAlt || "",
      };
    } else if (req.body.featuredAlt) {
      existingPackage.featuredImage = {
        ...existingPackage.featuredImage,
        alt: req.body.featuredAlt,
      };
    }

    if (req.files?.gallery) {
      const gallery = [];
      for (const file of req.files.gallery) {
        const result = await uploadToCloudinary(file.buffer, "packages");
        gallery.push({
          url: result.secure_url,
          alt: req.body[`galleryAlt_${file.originalname}`] || "",
        });
      }
      existingPackage.gallery = gallery;
    }

    if (req.body?.duration) {
      const match = req.body.duration.match(/^(\d+)D/i);
      if (match) {
        const days = parseInt(match[1], 10);
        existingPackage.itinerary = Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}`,
          description: "",
        }));
      }
    }
     const allowedStatuses = ["Draft", "Published"];
    const newStatus = req.body.status || existingPackage.status;

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        message: "Invalid status. Allowed values are: Draft, Published.",
      });
    }
    if (existingPackage.status === "Published" && newStatus === "Draft") {
      return res.status(400).json({
        message: "A published Package cannot be reverted back to Draft.",
      });
    }

    existingPackage.status = newStatus;

    if (newStatus === "Published" && !existingPackage.publishedAt) {
      existingPackage.publishedAt = new Date();
    }

    if (req.body?.moodOfJourney) {
      let moodInput = req.body.moodOfJourney;

      if (typeof moodInput === "string") {
        try {
          moodInput = JSON.parse(moodInput);
        } catch (e) {
          return res.status(400).json({ message: "Invalid moodOfJourney format" });
        }
      }


      const moodTitle = moodInput.title || moodInput;
      const moodData = getMoodData(moodTitle);

      if (!moodData) {
        return res.status(400).json({ message: "Invalid mood title" });
      }

      existingPackage.moodOfJourney = moodData;
    }



    const updatableFields = [
      "type",
      "title",
      "subtitle",
      "slug",
      "description",
      "price",
      "duration",
      "offbeat",
      "altitude",
      "altitudeunit",
      "difficultyLevel",
      "season",
      "country",
      "state",
      "city",
      "locationAddress",
      "startLocation",
      "endLocation",
      "inclusions",
      "exclusions",
      "itinerary",
      "status",
      "isActive"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        existingPackage[field] = req.body[field];
      }
    });

    if (faqData) existingPackage.faq = faqData;
    if (itinerary) existingPackage.itinerary = itinerary;
    if (discountData) existingPackage.discount = discountData;
    if (groupMembersData) existingPackage.groupMembers = groupMembersData;
    if (seoData) existingPackage.seo = seoData;
    if (batchesData) existingPackage.batches = batchesData;

    await existingPackage.save();

    res.status(200).json({
      message: "Package updated successfully",
      data: existingPackage,
    });
  } catch (err) {
    console.error("Update Package Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const { panel } = req.user;

    const { TravelPackage } = getPanelDb(panel);

    const { id } = req.params;

    const pkg = await TravelPackage.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!pkg) return res.status(404).json({ message: "Package not found" });

    res.status(200).json({ message: "Package soft deleted successfully" });
  } catch (err) {
    console.error("Soft Delete Error:", err);
    res.status(500).json({ message: "Failed to delete package" });
  }
};

// exports.permanentDeletePackage = async (req, res) => {
//   try {
//     const { panel } = req.user;

//     const { TravelPackage } = getPanelDb(panel);
//     const { id } = req.params;

//     const deleted = await TravelPackage.findByIdAndDelete(id);

//     if (!deleted) return res.status(404).json({ message: "Package not found" });

//     res.status(200).json({ message: "Package permanently deleted" });
//   } catch (err) {
//     console.error("Permanent Delete Error:", err);
//     res.status(500).json({ message: "Failed to permanently delete package" });
//   }
// };

exports.getAllPackages = async (req, res) => {
  try {
    const { panel } = req.user;

    const { TravelPackage } = getPanelDb(panel);

    const packages = await TravelPackage.find({ })
    .select(
        '_id moodOfJourney price discount type slug title duration state season batches isActive status updatedAt createdAt'
      )
      .sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "All packages fetched successfully",
      count: packages.length,
      data: packages,
    });
  } catch (err) {
    console.error("Get All Packages Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPackagesActiveFalse = async (req, res) => {
  try {
    const { panel } = req.user;

    const { TravelPackage } = getPanelDb(panel);

    const packages = await TravelPackage.find({ isActive: false }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "All packages fetched successfully",
      count: packages.length,
      data: packages,
    });
  } catch (err) {
    console.error("Get All Packages Error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getAllTours = async (req, res) => {
  try {
    const { panel } = req.user;

    const { TravelPackage } = getPanelDb(panel);

    const tours = await TravelPackage.find({
      type: "tour",
      isActive: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      message: "All tour packages fetched successfully",
      count: tours.length,
      data: tours,
    });
  } catch (err) {
    console.error("Get All Tours Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllTreks = async (req, res) => {
  try {
    const { panel } = req.user;

    const { TravelPackage } = getPanelDb(panel);

    const treks = await TravelPackage.find({
      type: "trek",
      isActive: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      message: "All trek packages fetched successfully",
      count: treks.length,
      data: treks,
    });
  } catch (err) {
    console.error("Get All Treks Error:", err);
    res.status(500).json({ message: err.message });
  }
};




exports.getOffbeatPackages = async (req, res) => {
  try {
    const panel = req?.params?.panel || req?.user?.panel;
    const { TravelPackage } = getPanelDb(panel);

    const packages = await TravelPackage.find({ offbeat: true })
      .select(
        "id type title slug price discount featuredImage season state duration groupMembers metaTitle metaDescription"
      );

    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching offbeat packages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPackageById = async (req, res) => {
  try {
    const { panel } = req.user;
    const { id } = req.params;

    const { TravelPackage } = getPanelDb(panel);

    const travelPackage = await TravelPackage.findById(id);

    if (!travelPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.status(200).json({
      message: "Package fetched successfully",
      data: travelPackage,
    });
  } catch (err) {
    console.error("Get Package by ID Error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getGroupedPackages = async (req, res) => {
  try {
    const panel = req.params.panel || req.user?.panel;
    const { TravelPackage } = getPanelDb(panel);

    const slug = req.params.slug;
    const limit = parseInt(req.query.limit) || 4;

    const validSlugs = ['travel-by-season', 'travel-by-mood', 'travel-by-region'];
    if (!slug || !validSlugs.includes(slug)) {
      return res.status(400).json({
        message: "Invalid or missing slug (use: travel-by-season, travel-by-mood, or travel-by-region)",
      });
    }

    let groups = [];

    if (slug === 'travel-by-season') {
      const seasons = await TravelPackage.distinct('season', { isActive: true });

      groups = await Promise.all(
        seasons.map(async (season) => {
          const packages = await TravelPackage.find({ season, isActive: true })
            .limit(limit)
            .select("id price discount featuredImage title subtitle slug duration");

          return { name: season, packages };
        })
      );
    }

    else if (slug === 'travel-by-mood') {
      const moods = await TravelPackage.distinct('moodOfJourney.title', { isActive: true });

      groups = await Promise.all(
        moods.map(async (moodTitle) => {
          const packages = await TravelPackage.find({ "moodOfJourney.title": moodTitle, isActive: true })
            .limit(limit)
            .select("id price discount featuredImage title subtitle slug duration");

          return { name: moodTitle, packages };
        })
      );
    }

    else if (slug === 'travel-by-region') {
      const states = await TravelPackage.distinct('state', { isActive: true });

      groups = await Promise.all(
        states.map(async (state) => {
          const packages = await TravelPackage.find({ state, isActive: true })
            .limit(limit)
            .select("id price discount featuredImage title subtitle slug duration");

          return { name: state, packages };
        })
      );
    }

    return res.status(200).json({
      message: `Packages grouped by ${slug} fetched successfully`,
      data: groups,
    });
  } catch (err) {
    console.error("Get Grouped Packages Error:", err);
    res.status(500).json({ message: "Something went wrong while fetching grouped packages." });
  }
};



// exports.getGroupedPackages = async (req, res) => {
//   try {
//     const panel = req.params.panel || req.user?.panel;
//     const { TravelPackage, Category} = getPanelDb(panel);

//     const slug = req.params.slug;
//     const limit = parseInt(req.query.limit) || 4;

// 3
    
    
//     const category = await Category.findOne({ uid: slug, isDeleted: false });

//     let groups = [];


//     if (slug === 'travel-by-season') {
//       const seasons = await TravelPackage.distinct('season', { isActive: true });

//       groups = await Promise.all(
//         seasons.map(async (season) => {
//           const packages = await TravelPackage.find({ season, isActive: true })
//             .limit(limit)
//             .select("id price discount featuredImage title subtitle slug duration");
//           return { name: season, packages };
//         })
//       );
//     }

  
//     else if (slug === 'travel-by-mood') {
//       const moods = await TravelPackage.distinct('moodOfJourney.title', { isActive: true });

//       groups = await Promise.all(
//         moods.map(async (moodTitle) => {
//           const packages = await TravelPackage.find({ "moodOfJourney.title": moodTitle, isActive: true })
//             .limit(limit)
//             .select("id price discount featuredImage title subtitle slug duration");
//           return { name: moodTitle, packages };
//         })
//       );
//     }


//     else if (slug === 'travel-by-region') {
//       const states = await TravelPackage.distinct('state', { isActive: true });

//       groups = await Promise.all(
//         states.map(async (state) => {
//           const packages = await TravelPackage.find({ state, isActive: true })
//             .limit(limit)
//             .select("id price discount featuredImage title subtitle slug duration");
//           return { name: state, packages };
//         })
//       );
//     }


//     else if (slug === 'offbeat-trips-in-india') {
//       const packages = await TravelPackage.find({ offbeat: true, isActive: true })
//         .sort({ updatedAt: -1 })
//         .limit(limit || 8)
//         .select("id price discount featuredImage title subtitle slug duration");

//       groups = [{ name: "Offbeat Trips", packages }];
//     }

   
//     else if (slug === 'upcoming-trips') {
//       const today = new Date();

//       const packages = await TravelPackage.find({
//         isActive: true,
//         "batches.fromDate": { $gte: today },
//       })
//         .sort({ "batches.fromDate": 1 })
//         .limit(limit || 8)
//         .select("id price discount featuredImage title subtitle slug duration");

//       groups = [{ name: "Upcoming Trips", packages }];
//     }

//     return res.status(200).json({
//       message: `Packages grouped by ${slug} fetched successfully`,
//       data: groups,
//       category: category || null,
//     });
//   } catch (err) {
//     console.error("Get Grouped Packages Error:", err);
//     res.status(500).json({ message: "Something went wrong while fetching grouped packages." });
//   }
// };
