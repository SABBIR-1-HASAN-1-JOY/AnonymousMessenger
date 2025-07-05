// routes/userRoutes.js
const express =require('express') ;
const { getUserProfile } =require('../controllers/userProfileControllers.js') ;
const { validateUserIdParam } =require('../validators/userValidator.js') ;

const router = express.Router();

router.get('/:userId', validateUserIdParam, getUserProfile);

module.exports = router;
