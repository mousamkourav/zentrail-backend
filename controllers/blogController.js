const { default: mongoose } = require("mongoose");
const getPanelDb = require("../config/dbManager");
const { uploadToCloudinary } = require("../middleware/multer");
const { indexNowSubmit } = require("../utils/indexNow");

exports.getAllBlogs = async (req, res) => {
  try {
    const panel = req.params.panel || req.user.panel;
    const { Blog } = getPanelDb(panel);

    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const type = req.query.type;
    const status = req.query.status;

    const filters = {
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    };

    let blogs, total, totalpages;
    if (!page || !limit) {
      blogs = await Blog.find(filters)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .select(
          "title type featuredImage meta.description uid id createdAt category authorName status lastUpdatedAt"
        );

      return res.status(200).json({
        success: true,
        pagination: false,
        totalblogs: blogs.length,
        blogs,
      });
    }
    const skip = (page - 1) * limit;

    [blogs, total] = await Promise.all([
      Blog.find(filters)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "title type featuredImage meta.description uid id createdAt category authorName status lastUpdatedAt"
        ),

      Blog.countDocuments(filters),
    ]);

    totalpages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      pagination: true,
      page,
      totalpages,
      totalblogs: total,
      blogs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const panel = req?.params?.panel || req.user.panel;
    const { Blog } = getPanelDb(panel);

    const identifier = req.params.id;

    let blog = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      blog = await Blog.findById({
        _id: identifier,
        isDeleted: false,
      }).populate("category", "name");
    }
    if (!blog) {
      blog = await Blog.findOne({ uid: identifier, isDeleted: false }).populate(
        "category",
        "name"
      );
    }

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.status(200).json({ blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { panel } = req.user;
    const { Blog } = getPanelDb(panel);

    let imageUrl = null;
    let public_id = "";

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "blogs");
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
    const blog = new Blog({
      ...req.body,
      type: req.body.type || "blog",
      faq: faqData,
      featuredImage: {
        url: imageUrl,
        altText: req.body.featuredImageAltText || "",
      },
    });
    await blog.save();
    const populatedBlog = await Blog.findById(blog._id).populate(
      "category",
      "name"
    );

    if (panel === "travel" && blog.status === "Published") {
      if (blog?.uid) {
        const domain = "www.zentrail.in";
        const url = `https://${domain}/blogs/${blog.uid}`;
        indexNowSubmit({ domain, url }).catch((err) =>
          console.error("IndexNow Failed:", err)
        );
      }
    }

    res.status(201).json({ populatedBlog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { panel } = req.user;
    const { Blog } = getPanelDb(panel);

    const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const tags = req.body.tags || [];
    const meta = req.body.meta || {};
    const ogTags = req.body.ogTags || {};

    let featuredImage = blog.featuredImage;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "blogs");
      featuredImage = {
        url: result.secure_url,
        altText: req.body.featuredImageAltText || "",
      };
    }
    let faq = req.body.faq;
    if (typeof faq === "string") {
      try {
        faq = JSON.parse(faq);
      } catch (e) {
        return res.status(400).json({ message: "Invalid FAQ format" });
      }
    }

    const allowedStatuses = ["Draft", "Published"];
    const newStatus = req.body.status || blog.status;

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        message: "Invalid status. Allowed values are: Draft, Published.",
      });
    }
    if (blog.status === "Published" && newStatus === "Draft") {
      return res.status(400).json({
        message: "A published blog cannot be reverted back to Draft.",
      });
    }

    blog.status = newStatus;

    if (newStatus === "Published" && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    blog.type = req.body.type || blog.type;
    blog.uid = req.body.uid || blog.uid;
    blog.title = req.body.title || blog.title;
    blog.authorName = req.body.authorName || blog.authorName;
    blog.description = req.body.description || blog.description;
    blog.category = req.body.category || blog.category;
    blog.tags = tags.length ? tags : blog.tags;
    blog.meta = Object.keys(meta).length ? meta : blog.meta;
    blog.ogTags = Object.keys(ogTags).length ? ogTags : blog.ogTags;
    blog.featuredImage = featuredImage;
    blog.faq = faq && Array.isArray(faq) ? faq : blog.faq;

    await blog.save();

    const populatedBlog = await Blog.findById(blog._id).populate(
      "category",
      "name"
    );

    const oldStatus = blog.status;
    const updatedStatus = newStatus; 
    if (
      panel === "travel" &&
      oldStatus === "Draft" &&
      updatedStatus === "Published" &&
      blog?.uid
    ) {
      const domain = "www.zentrail.in";
      const url = `https://${domain}/blogs/${blog.uid}`;

      indexNowSubmit({ domain, url }).catch((err) =>
        console.error("IndexNow Failed:", err)
      );
    }

    res.status(200).json({ populatedBlog });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { panel } = req.user;
    const { Blog } = getPanelDb(panel);

    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    if (blog.featuredImage?.public_id) {
      await cloudinary.uploader.destroy(blog.featuredImage.public_id);
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete blog" });
  }
};

// comment for pagination
exports.searchBlogs = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Blog, Category } = getPanelDb(panel);

    const searchTerm = req.query.query || "";
    const type = req.query.type;
    if (!searchTerm) {
      return res
        .status(400)
        .json({ message: "Search query parameter 'query' is required." });
    }

    const regex = new RegExp(searchTerm, "i");

    // ✅ find matching categories first
    const matchingCategories = await Category.find({ name: regex }).select(
      "_id"
    );

    const blogs = await Blog.find({
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      $or: [
        { title: regex },
        { tags: regex },
        { category: { $in: matchingCategories.map((c) => c._id) } }, // ✅ match category ids
      ],
    }).populate("category", "name");

    res.status(200).json({ results: blogs });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: err.message });
  }
};




exports.addComment = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment, Blog } = getPanelDb(panel);
    console.log("panel:", panel);
console.log("db:", getPanelDb(panel));

    const userId = req.user.id;  
    console.log("req.user:", req.user);
 // 🔐 from JWT
    const { blogId, text } = req.body;

    if (!blogId || !text) {
      return res.status(400).json({ message: "blogId & text required" });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = await Comment.create({
      blog: blogId,
      user: userId,
      text,
    });

    res.status(201).json({
      success: true,
      comment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.addReplyToComment = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment } = getPanelDb(panel);

    const userId = req.user.id;
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({
      user: userId,
      text,
    });

    await comment.save();

    res.status(201).json({
      success: true,
      message: "Reply added",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRepliesByComment = async (req, res) => {
  try {
    const { panel, commentId } = req.params;
    const { Comment } = getPanelDb(panel);

    const comment = await Comment.findById(commentId)
      .populate("replies.user", "fullName profilePic")
      .lean();

    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    res.status(200).json({
      success: true,
      replies: comment.replies || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// exports.getCommentsByBlog = async (req, res) => {
//   try {
//     const panel = req.params.panel;
//     const { Comment } = getPanelDb(panel);
//     const { blogId } = req.params;

//     // Pagination
//     const page = parseInt(req.query.page) || 1; // default page 1
//     const limit = 10; // 10 comments per page
//     const skip = (page - 1) * limit;

//     // Fetch comments with partial replies (limit 2 replies per comment)
//     const comments = await Comment.find({ blog: blogId, isDeleted: false })
//       .populate("user", "fullName profilePic")
//       .populate({
//         path: "replies.user",
//         select: "fullName profilePic",
//       })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean(); // use lean for easier modification

//     // Limit replies to first 2-3 (let's say 3)
//     const limitedComments = comments.map((comment) => {
//       return {
//         ...comment,
//         replies: comment.replies?.slice(0, 3), // show only 3 replies initially
//         totalReplies: comment.replies?.length || 0, // total replies count
//       };
//     });

//     // Total comments count for pagination
//     const totalComments = await Comment.countDocuments({ blog: blogId, isDeleted: false });

//     res.status(200).json({
//       success: true,
//       comments: limitedComments,
//       pagination: {
//         totalComments,
//         currentPage: page,
//         totalPages: Math.ceil(totalComments / limit),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.likeComment = async (req, res) => {
  const panel = req.params.panel;
  const { Comment } = getPanelDb(panel);

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Not found" });

  comment.likes += 1;
  await comment.save();

  res.json({ likes: comment.likes });
};
exports.updateComment = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment } = getPanelDb(panel);

    const userId = req.user.id;
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      user: userId,
      isDeleted: false,
    });

    if (!comment) {
      return res.status(403).json({
        message: "You are not allowed to edit this comment",
      });
    }

    comment.text = text;
    await comment.save();

    res.json({
      success: true,
      message: "Comment updated",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deleteComment = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment } = getPanelDb(panel);

    const userId = req.user.id;
    const { commentId } = req.params;

    const comment = await Comment.findOne({
      _id: commentId,
      user: userId,
      isDeleted: false,
    });

    if (!comment) {
      return res.status(403).json({
        message: "You are not allowed to delete this comment",
      });
    }

    comment.isDeleted = true;
    await comment.save();

    res.json({
      success: true,
      message: "Comment deleted (soft)",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateReply = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment } = getPanelDb(panel);

    const userId = req.user.id;
    const { commentId, replyId } = req.params;
    const { text } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(replyId);

    if (!reply || reply.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not allowed to edit this reply",
      });
    }

    reply.text = text;
    await comment.save();

    res.json({ success: true, message: "Reply updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deleteReply = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment } = getPanelDb(panel);

    const userId = req.user.id;
    const { commentId, replyId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(replyId);

    if (!reply || reply.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not allowed to delete this reply",
      });
    }

    reply.isDeleted = true;
    await comment.save();

    res.json({ success: true, message: "Reply deleted (soft)" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.likeReply = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment } = getPanelDb(panel);

    const { commentId, replyId } = req.params;

    const comment = await Comment.findOne({
      _id: commentId,
      isDeleted: false,
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const reply = comment.replies.id(replyId);

    if (!reply || reply.isDeleted) {
      return res.status(404).json({ message: "Reply not found" });
    }

    reply.likes += 1;

    await comment.save();

    res.status(200).json({
      success: true,
      replyId: reply._id,
      likes: reply.likes,
    });
  } catch (err) {
    console.error("Like Reply Error:", err);
    res.status(500).json({ message: err.message });
  }
};
exports.getCommentsByBlog = async (req, res) => {
  try {
    const panel = req.params.panel;
    const { Comment } = getPanelDb(panel);
    const { blogId } = req.params;

    // Pagination
    const page = parseInt(req.query.page) || 1; // default page 1
    const limit = parseInt(req.query.limit) || 10; // default 10 per page
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ blog: blogId, isDeleted: false })
      .populate("user", "fullName profilePic")
      .populate({
        path: "replies.user",
        select: "fullName profilePic",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Limit replies to first 3
    const limitedComments = comments.map((comment) => ({
      ...comment,
      replies: comment.replies?.slice(0, 3),
      totalReplies: comment.replies?.length || 0,
    }));

    const totalComments = await Comment.countDocuments({ blog: blogId, isDeleted: false });

    res.status(200).json({
      success: true,
      comments: limitedComments,
      pagination: {
        totalComments,
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
