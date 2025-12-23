import jwt from "jsonwebtoken";
import db from "../db/firebaseAdmin.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: no token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: invalid token" });
    }

    // ✅ FIX IS HERE
    const userId = decoded.id;   // 👈 NOT decoded.userId

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: invalid token payload" });
    }

    const snap = await db.ref(`users/${userId}`).once("value");
    const userObj = snap.exists() ? snap.val() : null;

    if (!userObj) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }

    req.user = { ...userObj, _id: userId };
    next();

  } catch (error) {
    console.error("Error in protectRoute:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
