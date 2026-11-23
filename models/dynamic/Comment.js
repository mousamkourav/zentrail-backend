const mongoose = require("mongoose");
const { Schema } = mongoose;

// const commentSchema = new Schema(
//   {
//     blog: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Blog",
//       required: true,
//       index: true,
//     },
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 100,
//     },
//     text: {
//       type: String,
//       required: true,
//       trim: true,
//       minlength: 1,
//       maxlength: 2000,
//     },
//     likes: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//     replies: [
//       {
//         name: {
//           type: String,
//           trim: true,
//           maxlength: 100,
//         },
//         text: {
//           type: String,
//           trim: true,
//           maxlength: 2000,
//         },
//         likes: {
//           type: Number,
//           default: 0,
//           min: 0,
//         },
//         createdAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],
//   },
//   {
//     timestamps: {
//       createdAt: "createdAt",
//       updatedAt: "updatedAt",
//     },
//   }
// );

// commentSchema.index({ blog: 1, isDeleted: 1 });
// commentSchema.index({ createdAt: -1 });

// module.exports = commentSchema;
const commentSchema = new Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    likes: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
        likes: {
          type: Number,
          default: 0,
        },
         isDeleted: {
      type: Boolean,
      default: false,
    },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

commentSchema.index({ blog: 1, isDeleted: 1 });
commentSchema.index({ createdAt: -1 });

// 📌 export schema only — NOT mongoose.model
module.exports = commentSchema;
