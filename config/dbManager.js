// const mongoose = require('mongoose');
// const models = require('../models/dynamic');

// const connections = {};

// const allowedModels = {
//   event: ['Blog', 'Category', 'Service', 'servicePage', 'inqueryform', 'Portfolio','Subscriber'],
//   travel: ['Blog', 'Category', 'subCategory', 'inqueryform', 'TravelPackage',"User",'Subscriber','Booking'],
//   vyomedge_uk: ['Blog', 'Category', 'Portfolio',"inqueryform","Service","servicePage"],
// };

// const getPanelDb = (panel) => {
//   if (!panel) throw new Error('Panel is required');

//   const dbName = {
//     event: 'Poornam-event',
//     travel: 'Travel',
//     vyomedge_uk: 'vyomedge_uk',
//   }[panel];

//   if (!dbName) throw new Error('Invalid panel');

//   if (connections[dbName]) return connections[dbName];

//   const db = mongoose.connection.useDb(dbName, { useCache: true });

//   const registeredModels = {};
//   const allowed = allowedModels[panel] || [];

//   for (const modelName of allowed) {
//     if (models[modelName]) {
//       registeredModels[modelName] = db.model(modelName, models[modelName]);
//     } else {
//       console.warn(`Model "${modelName}" not found in dynamic models`);
//     }
//   }

//   connections[dbName] = registeredModels;
//   return registeredModels;
// };

// module.exports = getPanelDb;
// module.exports.allowedModels=allowedModels;

// config/dbManager.js
const mongoose = require("mongoose");
const models = require("../models/dynamic");

const panelToDbName = {
  event: "Poornam-event",
  travel: "Travel",
  vyomedge_uk: "vyomedge_uk",
  ed_tech: "ed_tech",
  madhubhan: "madhubhan",
  vyomedge_in: "vyomedge_in",
};

const allowedModels = {
  event: [
    "Blog",
    "Category",
    "Service",
    "servicePage",
    "inqueryform",
    "Portfolio",
    "Subscriber",
    "User",
    "Comment"
  ],
  travel: [
    "Blog",
    "Category",
    "subCategory",
    "inqueryform",
    "TravelPackage",
    "Subscriber",
    "Booking",
    "User",
    "Comment"
  ],
  vyomedge_uk: [
    "Blog",
    "Category",
    "Portfolio",
    "inqueryform",
    "Service",
    "servicePage",
    "User",
    "Comment"
  ],
  ed_tech: ["Blog", "Category", "inqueryform", "User","Comment"],
  madhubhan: ["Blog", "Category"],
  vyomedge_in: ["Blog", "inqueryform", "servicePage", "Service", "Category","User","Comment"],
};

const connectionsCache = {};

function createModelsForDb(dbName, panelName) {
  if (connectionsCache[dbName]) return connectionsCache[dbName];

  const db = mongoose.connection.useDb(dbName, { useCache: true });

  const registeredModels = {};
  const allowed = allowedModels[panelName] || [];

  for (const modelName of allowed) {
    if (models[modelName]) {
      registeredModels[modelName] = db.model(modelName, models[modelName]);
    } else {
      console.warn(`Model "${modelName}" not found in dynamic models`);
    }
  }

  connectionsCache[dbName] = registeredModels;
  return registeredModels;
}

function getPanelDb(panel) {
  if (!panel) throw new Error("Panel is required");
  const dbName = panelToDbName[panel];
  if (!dbName) throw new Error(`Invalid panel: ${panel}`);
  return createModelsForDb(dbName, panel);
}

function getDbForUser(user, panelOverride) {
  if (!user) throw new Error("User is required");

  if (user.role === "superadmin") {
    if (panelOverride) {
      return getPanelDb(panelOverride);
    }

    const merged = {};
    const panels = Object.keys(panelToDbName);
    for (const p of panels) {
      const dbModels = getPanelDb(p);
      Object.assign(merged, dbModels);
    }
    return merged;
  }

  const panel = panelOverride || user.panel;
  return getPanelDb(panel);
}

getPanelDb.allowedModels = allowedModels;
getPanelDb.getDbForUser = getDbForUser;
getPanelDb.panelToDbName = panelToDbName;

module.exports = getPanelDb;
