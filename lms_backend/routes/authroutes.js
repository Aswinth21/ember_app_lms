import express from "express";
import { login, logout, signup, getUser, getAllUsers, getUserById } from "../controllers/authController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/user", protectRoute, getUser);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", protectRoute, getAllUsers);
router.get("/user/:userId", getUserById);


export default router;
