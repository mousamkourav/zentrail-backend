const express = require("express");
const router = express.Router();
const { subscribe } = require('../controllers/subscribeController');

router.post('/:panel', subscribe);

module.exports = router;
