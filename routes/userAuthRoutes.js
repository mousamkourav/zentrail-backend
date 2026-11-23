const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');
const loginContoller = require('../controllers/loginContoller');


// Traditional Signup/Login
router.post('/:panel/signup', signupController.signup);
router.post('/:panel/login', loginContoller.login);
router.post('/:panel/signup-google', signupController.signup);
router.post('/:panel/google-login', loginContoller.login);

  
router.post('/:panel/forgot-password-otp', signupController.forgotPasswordWithOTP);
router.post('/:panel/verify-otp-reset', signupController.verifyOtpAndResetPassword);

const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
router.get('/alluser',protect, signupController.userList);
router.get('/:panel/user/profile', protect, signupController.getUserProfile);
router.put('/:panel/user/update', protect, upload.fields([{ name: "profilePic", maxCount: 1 }]), signupController.updateUser);
router.get('/:panel/user/profile-completion', protect, signupController.getProfileCompletion )
module.exports = router;









