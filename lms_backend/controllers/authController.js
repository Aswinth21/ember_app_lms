import bcrypt from "bcryptjs";
import db from "../db/firebaseAdmin.js";
import generateTokenAndSetCookie from "../lib/utils/generateTokensAndSetCookie.js";

async function findUserByUsername(username) {
  const ref = db.ref("users");
  const snap = await ref.orderByChild("username").equalTo(username).once("value");
  if (!snap.exists()) return null;
  const obj = snap.val();
  const [id, data] = Object.entries(obj)[0];
  return { id, data };
}

async function findUserByField(field, value) {
  const ref = db.ref("users");
  const snap = await ref.orderByChild(field).equalTo(value).once("value");
  if (!snap.exists()) return null;
  const obj = snap.val();
  const [id, data] = Object.entries(obj)[0];
  return { id, data };
}

export const signup = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role = "student",
      name,
      contact,
      department,
      registerNumber,
    } = req.body;

    if (!username || !email || !password || !name || !contact || !department || !registerNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (await findUserByUsername(username)) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }
    if (await findUserByField("email", email)) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    if (await findUserByField("contact", contact)) {
      return res.status(400).json({ success: false, message: "Contact already exists" });
    }
    if (await findUserByField("registerNumber", registerNumber)) {
      return res.status(400).json({ success: false, message: "Register number already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usersRef = db.ref("users");
    const newUserRef = usersRef.push();
    const userId = newUserRef.key;

    const userObj = {
      username,
      email,
      password: hashedPassword,
      role,
      name,
      contact,
      department,
      registerNumber,
      createdAt: Date.now(),
    };

    await newUserRef.set(userObj);

    generateTokenAndSetCookie(userId, res);

    return res.status(201).json({
      success: true,
      _id: userId,
      username,
      name,
      email,
      role,
    });
  } catch (error) {
    console.error("error in signup controller:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const found = await findUserByUsername(username);
    if (!found) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { id: userId, data: user } = found;
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    generateTokenAndSetCookie(userId, res);

    return res.status(200).json({
      success: true,
      _id: userId,
      username: user.username,
      message: `Logged in as ${user.role}`,
    });
  } catch (error) {
    console.error("error in login controller:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "lax" });
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const snap = await db.ref(`users/${userId}`).once('value');
    if (!snap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = snap.val();
    delete user.password;

    return res.json({
      success: true,
      user: {
        _id: userId,
        ...user,
        enrollRequests: user.enrollRequests || {}
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


export const getAllMembers = async (req, res) => {
  try {
    const { courseId } = req.params;

    const snap = await courseRef(courseId).once("value");
    if (!snap.exists()) return res.status(404).json({ error: "Course not found" });

    const courseObj = snap.val();

    const memberIds = new Set([
      ...(courseObj.users ? Object.keys(courseObj.users) : []),
      ...(courseObj.admins ? Object.keys(courseObj.admins) : []),
      courseObj.creator
    ].filter(Boolean));

    const members = await Promise.all(
      Array.from(memberIds).map((uid) => fetchUserBasic(uid))
    );

    return res.json({ courseId, members });

  } catch (err) {
    console.error("getAllMembers error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const snap = await db.ref("users").once("value");

    if (!snap.exists()) {
      return res.json([]);
    }

    const usersObj = snap.val();

    const users = Object.entries(usersObj).map(([uid, user]) => ({
      _id: uid,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role || "student",
      contact: user.contact || "",
      department: user.department || "",
      registerNumber: user.registerNumber || "",
      avatar: user.avatar || "",
    }));

    return res.json(users);

  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const snap = await db.ref(`users/${userId}`).once("value");

    if (!snap.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = snap.val();

    return res.json({
      _id: userId,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.contact,
      department: user.department,
      registerNumber: user.registerNumber,
      avatar: user.avatar || null,
      courses: user.courses || {}
    });

  } catch (error) {
    console.error("getUserById error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
