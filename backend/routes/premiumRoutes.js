const express = require('express');
const premiumController = require('../controllers/premiumController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/status', premiumController.getPremiumStatus);
router.post('/subscribe', premiumController.subscribePremium);
router.get('/history', premiumController.getChatHistory);
router.post('/chat', premiumController.sendChatMessage);
router.post('/history/clear', premiumController.clearChatHistory);
router.post('/unlock-market-price', premiumController.unlockMarketPrice);
router.post('/unlock-feed-planner', premiumController.unlockFeedPlanner);

module.exports = router;
