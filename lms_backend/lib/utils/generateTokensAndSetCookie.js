import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("jwt", token, {
  httpOnly: true,
  sameSite: "lax",   // ✅ works on http
  secure: false,     // ✅ required on localhost
  maxAge: 7 * 24 * 60 * 60 * 1000
});


};

export default generateTokenAndSetCookie;
