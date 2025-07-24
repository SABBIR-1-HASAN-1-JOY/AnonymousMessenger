// routes/userRoutes.js
const express =require('express') ;
const { getUserProfile, updateUserProfile } =require('../controllers/userProfileControllers.js') ;
const { validateUserIdParam } =require('../validators/userValidator.js') ;

const router = express.Router();

router.get('/:userId', validateUserIdParam, getUserProfile);
router.put('/:userId', validateUserIdParam, updateUserProfile);

module.exports = router;
