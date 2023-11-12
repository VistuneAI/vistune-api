const express = require('express');
const convertAudio = require('./controllers/convertAudio');

const router = express.Router();

router.get('/convertAudio', convertAudio);

module.exports = router;