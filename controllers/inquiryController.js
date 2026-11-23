const getPanelDb = require("../config/dbManager");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

exports.migrateInquirySchema = async (req, res) => {
  try {
    const { panel } = req.params;

    if (!panel) {
      return res.status(400).json({ message: "Panel parameter is required" });
    }

    const { inqueryform } = getPanelDb(panel);
    if (!inqueryform) {
      return res.status(400).json({ message: "Inquiry model not found for this panel" });
    }

    const result = await inqueryform.updateMany(
      {},
      {
        $set: {
          source: "website",
          campaign: "",
          status: "New",
          tag: "Interested",
          remarks: "",
          assigned_to: "",
          isDeleted: false,
        },
        $setOnInsert: { submittedAt: new Date() },
      }
    );

    res.json({
      success: true,
      panel,
      message: "Inquiry schema migration complete",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
};

exports.uploadExcel = async (req, res) => {
  try {
    const { panel } = req.params;

    if (!panel) {
      return res.status(400).json({ message: "Panel parameter is required" });
    }

    const { inqueryform } = getPanelDb(panel);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const formatted = rows.map((row) => {
      console.log('row["Date"]',row)

const formattedDate = new Date((row["Date"] - 25569) * 86400 * 1000);

      const knownFields = [
        "Date",
        "fullName",
        "email",
        "phoneNo",
        "source",
        "campaign",
        "message",
        "sourcePage",
        "Remark",
      ];

      // ✅ Extract unknown (extra) columns dynamically
      const extraFields = {};
      Object.keys(row).forEach((key) => {
        if (!knownFields.includes(key)) {
          extraFields[key] = row[key];
        }
      });

      return {
        fullName: row["fullName"] || "",
        email: row["email"] || "",
        phoneNo: String(row["phoneNo"] || ""),
        source: row["source"] || "website",
        campaign: row["campaign"] || "",
        status: "New",
        tag: "Interested",
        remarks: row["Remark"] || "",
        assigned_to: "",
        message: row["message"] || "",
        sourcePage: row["sourcePage"] || "",
        submittedAt: new Date((row["Date"] - 25569) * 86400 * 1000),
        createdAt: new Date((row["Date"] - 25569) * 86400 * 1000),
        updatedAt: new Date((row["Date"] - 25569) * 86400 * 1000),
        extraFields,
      };
    });
    console.log("forscszzdv",formatted)

    // ✅ Insert data into MongoDB
    const result = await inqueryform.insertMany(formatted);

    // ✅ Delete uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });

    res.status(200).json({
      message: "Excel data imported successfully to database!",
      total: formatted.length,
      result: result,
    });
  } catch (err) {
    console.error("Error importing Excel:", err);
    res.status(500).json({ message: "Error importing Excel data" });
  }
};



// exports.uploadExcel = async (req, res) => {
//   try {
//     const { panel } = req.params;

//     if (!panel) {
//       return res.status(400).json({ message: "Panel parameter is required" });
//     }

//     const { inqueryform } = getPanelDb(panel);

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     // ✅ Read Excel file
//     const workbook = XLSX.readFile(req.file.path);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rows = XLSX.utils.sheet_to_json(sheet);

//     // ✅ Map each row
//     const formatted = rows.map((row) => {
//       let formattedDate = new Date(); // Default aaj ka date

//       const rawDate = String(row["Date"] || "").trim();
//       if (rawDate) {
//         try {
//           // Replace dots/slashes with dash
//           const cleanDate = rawDate.replace(/[./]/g, "-");
//           const parts = cleanDate.split("-");

//           if (parts.length === 3) {
//             const [day, month, year] = parts.map((p) => p.trim());
//             const fullYear = year.length === 2 ? `20${year}` : year;

//             // ✅ Convert to ISO date
//             const isoDate = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(
//               2,
//               "0"
//             )}T00:00:00.000Z`;

//             formattedDate = new Date(isoDate);
//           }
//         } catch (err) {
//           console.error("Date parsing error:", rawDate, err);
//         }
//       }

//       // ✅ Known fields (already part of schema)
//       const knownFields = [
//         "Date",
//         "fullName",
//         "email",
//         "phoneNo",
//         "source",
//         "campaign",
//         "message",
//         "sourcePage",
//         "Remark",
//       ];

//       // ✅ Extract unknown (extra) columns dynamically
//       const extraFields = {};
//       Object.keys(row).forEach((key) => {
//         if (!knownFields.includes(key)) {
//           extraFields[key] = row[key];
//         }
//       });

//       return {
//         fullName: row["fullName"] || "",
//         email: row["email"] || "",
//         phoneNo: String(row["phoneNo"] || ""),
//         source: row["source"] || "website",
//         campaign: row["campaign"] || "",
//         status: "New",
//         tag: "Interested",
//         remarks: row["Remark"] || "",
//         assigned_to: "",
//         message: row["message"] || "",
//         sourcePage: row["sourcePage"] || "",
//         submittedAt: formattedDate,
//         createdAt: formattedDate,
//         extraFields,
//       };
//     });

//     // ✅ Insert data into MongoDB
//     const result = await inqueryform.insertMany(formatted);

//     // ✅ Delete uploaded file
//     fs.unlink(req.file.path, (err) => {
//       if (err) console.error("Error deleting uploaded file:", err);
//     });

//     res.status(200).json({
//       message: "Excel data imported successfully to database!",
//       total: formatted.length,
//       result: result,
//     });
//   } catch (err) {
//     console.error("Error importing Excel:", err);
//     res.status(500).json({ message: "Error importing Excel data" });
//   }
// };




exports.createInquiry = async (req, res) => {
  try {
    const { panel } = req.params;
    if (!panel) {
      return res.status(400).json({ message: "Panel parameter is required" });
    }

    const { inqueryform } = getPanelDb(panel);
    if (!inqueryform) {
      return res.status(400).json({ message: "Inquiry model not found for this panel" });
    }

    const { fullName, email, phoneNo, message, extraFields, sourcePage } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: "Full name and email are required" });
    }

    const existing = await inqueryform.findOne({ email, isDeleted: false });
    if (existing) {
      return res.status(400).json({ message: "This email already exists." });
    }

    const inquiry = new inqueryform({
      fullName,
      email: email.toLowerCase().trim(),
      phoneNo,
      message,
      extraFields,
      sourcePage,
      source: "website", // default
      campaign: "",
      status: "New",
      tag: "Interested",
      remarks: "",
      assigned_to: "",
    });

    await inquiry.save();

    res.status(201).json({
      message: "Inquiry submitted successfully!",
      data: inquiry,
    });
  } catch (err) {
    console.error("Inquiry submission error:", err);

    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "This email already exists." });
    }

    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};


exports.updateInquiry = async (req, res) => {
  try {
    const panel = req.user?.panel || req.params.panel;
    const { id } = req.params;

    if (!panel || !id) {
      return res.status(400).json({ message: "Panel and inquiry ID are required" });
    }

    const { inqueryform } = getPanelDb(panel);
    if (!inqueryform) {
      return res.status(400).json({ message: "Inquiry model not found for this panel" });
    }

    const allowedFields = ["assigned_to", "campaign", "remarks", "source", "status", "tag"];
    const updateData = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
      }
    }
    if (req.body.assigned_to) {
      updateData.assignedBy = req.user.id;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

    const updated = await inqueryform.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Inquiry updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("Inquiry update error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};




exports.getAllInquiries = async (req, res) => {
  try {
    const { panel, id: userId, role } = req?.user;
    const { startDate, endDate } = req.query;
    if (!panel) {
      return res.status(400).json({ message: "Panel parameter is required" });
    }

    const { inqueryform } = getPanelDb(panel);
    if (!inqueryform) {
      return res.status(400).json({ message: "Inquiry model not found for this panel" });
    }
    let filter = {};

    if (role === "executive") {
      filter = { assigned_to: userId };
    } else if (role === "manager") {
      filter = {
        $or: [
          { assigned_to: userId },
          { assignedBy: userId }
        ]
      };
    } else if (role === "admin") {
      filter = {};
    }
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      if (!isNaN(start) && !isNaN(end)) {
        filter.createdAt = { $gte: start, $lte: end };
      } else {
        console.log("Invalid date format received");
      }
    }

    const inquiries = await inqueryform.find(filter).sort({ createdAt: -1 });

    // const inquiries = await inqueryform.find().sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      message: "Inquiries fetched successfully!",
      total: inquiries.length,
      data: inquiries,
    });
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};
exports.deleteInquiry = async (req, res) => {
  try {
    const { panel, id } = req.params;
    if (!panel || !id) {
      return res.status(400).json({ message: "Panel and ID parameters are required" });
    }

    const { inqueryform } = getPanelDb(panel);
    if (!inqueryform) {
      return res.status(400).json({ message: "Inquiry model not found for this panel" });
    }

    const inquiry = await inqueryform.findByIdAndDelete(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.status(200).json({
      message: "Inquiry deleted successfully!",
      data: inquiry,
    });
  } catch (err) {
    console.error("Error deleting inquiry:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};