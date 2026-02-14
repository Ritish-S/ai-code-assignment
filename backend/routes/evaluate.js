const express = require('express');
const router = express.Router();
const { postEvaluate } = require('../controllers/evaluateController');

router.post('/', postEvaluate);

module.exports = router;