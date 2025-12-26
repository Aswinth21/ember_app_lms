import db from "../db/firebaseAdmin.js";

function now() {
  return Date.now();
}

const courseRef = (courseId) => db.ref(`courses/${courseId}`);
const userRef = (userId) => db.ref(`users/${userId}`);

/* ---------------- HELPERS ---------------- */

function userIsAdmin(courseObj, userId) {
  if (!courseObj || !userId) return false;
  if (String(courseObj.creator) === String(userId)) return true;
  if (courseObj.admins && courseObj.admins[String(userId)]) return true;
  return false;
}

async function addCourseToUser(userId, courseId, role) {
  await db.ref(`users/${userId}/courses/${courseId}`).set({
    role,
    addedAt: now()
  });
}

async function removeCourseFromUser(userId, courseId) {
  await db.ref(`users/${userId}/courses/${courseId}`).remove();
}

export const createCourse = async (req, res) => {
  try {
    const creatorId = String(req.user?._id);
    if (!creatorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      description = "",
      contents = [],
      users = [],
      admins = []
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Course name is required" });
    }

    const courseRef = db.ref("courses").push();
    const courseId = courseRef.key;

    /* ===============================
       CONTENTS
       =============================== */
    const contentsObj = {};
    if (Array.isArray(contents)) {
      contents.forEach((c, index) => {
        const contentId = db.ref().push().key;
        contentsObj[contentId] = {
          title: c.title || "",
          description: c.description || "",
          videoUrl: c.videoUrl || "",
          order: index + 1,
          createdAt: Date.now()
        };
      });
    }

    /* ===============================
       ADMINS (creator included)
       =============================== */
    const adminsMap = {};
    admins.forEach(id => {
      if (id) adminsMap[String(id)] = true;
    });
    adminsMap[creatorId] = true;

    /* ===============================
       USERS (students only)
       =============================== */
    const usersMap = {};
    users.forEach(id => {
      if (id && !adminsMap[id]) {
        usersMap[String(id)] = true;
      }
    });

    /* ❌ DO NOT ADD CREATOR TO USERS */

    const courseObj = {
      name,
      description,
      contents: contentsObj,
      creator: creatorId,
      admins: adminsMap,
      users: usersMap,
      requests: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await courseRef.set(courseObj);

    /* ===============================
       ADD COURSE TO USERS COLLECTION
       =============================== */
    const allUsers = new Set([
      ...Object.keys(usersMap),
      ...Object.keys(adminsMap)
    ]);

    for (const uid of allUsers) {
      await db.ref(`users/${uid}/courses/${courseId}`).set({
        role: adminsMap[uid] ? "admin" : "student",
        addedAt: Date.now()
      });
    }

    /* Explicit creator role */
    await db.ref(`users/${creatorId}/courses/${courseId}`).set({
      role: "creator",
      addedAt: Date.now()
    });

    return res.status(201).json({
      success: true,
      courseId
    });

  } catch (err) {
    console.error("createCourse error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
};


/* ---------------- UPDATE COURSE (SINGLE API) ---------------- */

export const updateCourse = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { courseId } = req.params;
    const { name, description, contents = [], users = [], admins = [] } = req.body;

    const snap = await courseRef(courseId).once("value");
    if (!snap.exists()) return res.status(404).json({ error: "Course not found" });

    const courseObj = snap.val();
    if (!userIsAdmin(courseObj, userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    /* ----- CONTENTS (REPLACE) ----- */
    const contentsObj = {};
    contents.forEach((c, i) => {
      const id = c.id || db.ref().push().key;
      contentsObj[id] = {
        title: c.title || "",
        description: c.description || "",
        videoUrl: c.videoUrl || "",
        order: c.order ?? i + 1,
        createdAt: c.createdAt || now(),
        updatedAt: now()
      };
    });

    /* ----- ADMINS / USERS ----- */
    const adminsMap = {};
    admins.forEach(id => adminsMap[String(id)] = true);
    adminsMap[String(courseObj.creator)] = true;

    const usersMap = {};
    users.forEach(id => {
      if (!adminsMap[String(id)]) usersMap[String(id)] = true;
    });

    const updates = {
      updatedAt: now(),
      contents: contentsObj,
      admins: adminsMap,
      users: usersMap
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    await courseRef(courseId).update(updates);

    /* ----- SYNC USER COURSES ----- */
    const finalUserIds = new Set([...Object.keys(usersMap), ...Object.keys(adminsMap)]);
    const prevUserIds = new Set([
      ...(courseObj.users ? Object.keys(courseObj.users) : []),
      ...(courseObj.admins ? Object.keys(courseObj.admins) : [])
    ]);

    for (const uid of prevUserIds) {
      if (!finalUserIds.has(uid)) {
        await removeCourseFromUser(uid, courseId).catch(() => {});
      }
    }

    for (const uid of finalUserIds) {
      await addCourseToUser(uid, courseId, adminsMap[uid] ? "admin" : "student");
    }

    const updated = (await courseRef(courseId).once("value")).val();
    return res.json({ _id: courseId, ...updated });

  } catch (err) {
    console.error("updateCourse:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- DELETE COURSE ---------------- */

export const deleteCourse = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { courseId } = req.params;

    const snap = await courseRef(courseId).once("value");
    if (!snap.exists()) return res.status(404).json({ error: "Course not found" });

    const courseObj = snap.val();
    if (!userIsAdmin(courseObj, userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const memberIds = new Set([
      ...(courseObj.users ? Object.keys(courseObj.users) : []),
      ...(courseObj.admins ? Object.keys(courseObj.admins) : []),
      courseObj.creator
    ]);

    await courseRef(courseId).remove();

    for (const uid of memberIds) {
      await removeCourseFromUser(uid, courseId).catch(() => {});
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("deleteCourse:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- GET COURSE ---------------- */

export const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const snap = await courseRef(courseId).once("value");
    if (!snap.exists()) {
      return res.status(404).json({ error: "Course not found" });
    }

    const course = snap.val();

    async function fetchUser(uid) {
      const uSnap = await userRef(uid).once("value");
      if (!uSnap.exists()) return null;

      const u = uSnap.val();
      return {
        _id: uid,
        name: u.name,
        registerNumber: u.registerNumber,
        department: u.department,
        role: u.role
      };
    }

    const memberIds = Object.keys(course.users || {});
    const members = (await Promise.all(memberIds.map(fetchUser))).filter(Boolean);
    const adminIds = Object.keys(course.admins || {});
    const admins = (await Promise.all(adminIds.map(fetchUser))).filter(Boolean);


    return res.json({
      _id: courseId,
      name: course.name,
      description: course.description,
      contents: course.contents || {},
      members,
      admins
    });

  } catch (err) {
    console.error("getCourse error:", err);
    return res.status(500).json({ error: err.message });
  }
};


/* ---------------- LIST COURSES ---------------- */

export const listCourses = async (req, res) => {
  try {
    const snap = await db.ref("courses").once("value");

    const courses = snap.exists()
      ? Object.entries(snap.val()).map(([id, c]) => ({
          _id: id,
          ...c
        }))
      : [];

    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= ENROLL REQUEST ================= */

export const requestEnroll = async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.params;

  const courseSnap = await courseRef(courseId).once('value');
  if (!courseSnap.exists()) {
    return res.status(404).json({ error: 'Course not found' });
  }

  await db.ref(`courses/${courseId}/requests/${userId}`).set({
    status: 'pending',
    createdAt: Date.now()
  });

  await db.ref(`users/${userId}/requests/${courseId}`).set({
    status: 'pending',
    createdAt: Date.now()
  });

  res.json({ success: true });
};

/* ================= LIST REQUESTS (ADMIN) ================= */

export const listCourseRequests = async (req, res) => {
  const { courseId } = req.params;
  const adminId = req.user._id;

  const snap = await courseRef(courseId).once('value');
  if (!snap.exists()) return res.status(404).json({ error: 'Not found' });

  const course = snap.val();
  if (!userIsAdmin(course, adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const requests = course.requests || {};
  const result = [];

  for (const uid of Object.keys(requests)) {
    const uSnap = await userRef(uid).once('value');
    if (!uSnap.exists()) continue;

    result.push({
      _id: uid,
      name: uSnap.val().name,
      registerNumber: uSnap.val().registerNumber,
      status: requests[uid].status
    });
  }

  res.json(result);
};

/* ================= ACCEPT REQUEST ================= */

export const acceptRequest = async (req, res) => {
  const { courseId, userId } = req.params;
  const adminId = req.user._id;

  const snap = await courseRef(courseId).once('value');
  if (!snap.exists()) return res.status(404).json({ error: 'Not found' });

  const course = snap.val();
  if (!userIsAdmin(course, adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await addCourseToUser(userId, courseId, 'student');

  await db.ref(`courses/${courseId}/users/${userId}`).set(true);
  await db.ref(`courses/${courseId}/requests/${userId}`).remove();
  await db.ref(`users/${userId}/requests/${courseId}`).set({
    status: 'accepted',
    updatedAt: Date.now()
  });

  res.json({ success: true });
};

/* ================= REJECT REQUEST ================= */

export const rejectRequest = async (req, res) => {
  const { courseId, userId } = req.params;
  const adminId = req.user._id;

  const snap = await courseRef(courseId).once('value');
  if (!snap.exists()) return res.status(404).json({ error: 'Not found' });

  const course = snap.val();
  if (!userIsAdmin(course, adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await db.ref(`courses/${courseId}/requests/${userId}`).remove();
  await db.ref(`users/${userId}/requests/${courseId}`).set({
    status: 'rejected',
    updatedAt: Date.now()
  });

  res.json({ success: true });
};

export const handleEnrollmentRequest = async (req, res) => {
  try {
    const adminId = String(req.user._id);
    const { courseId, userId } = req.params;
    const { action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const snap = await courseRef(courseId).once("value");
    if (!snap.exists()) {
      return res.status(404).json({ error: "Course not found" });
    }

    const course = snap.val();

    // 🔒 Only creator or admin can act
    if (
      course.creator !== adminId &&
      !course.admins?.[adminId]
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // ❌ No request exists
    if (!course.requests || !course.requests[userId]) {
      return res.status(404).json({ error: "Request not found" });
    }

    // ✅ APPROVE
    if (action === "approve") {
      // Add user to course
      await db.ref(`courses/${courseId}/users/${userId}`).set(true);

      // Add course to user
      await db.ref(`users/${userId}/courses/${courseId}`).set({
        role: "student",
        addedAt: Date.now()
      });
    }

    // 🧹 Remove request in both cases
    await db.ref(`courses/${courseId}/requests/${userId}`).remove();

    return res.json({ success: true, action });

  } catch (err) {
    console.error("handleEnrollmentRequest error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { courseId } = req.params;

    const snap = await courseRef(courseId).once('value');
    if (!snap.exists()) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = snap.val();

    // Already enrolled
    if (course.users?.[userId] || course.admins?.[userId]) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    // Already requested
    if (course.requests?.[userId] === 'pending') {
      return res.status(400).json({ error: 'Request already pending' });
    }

    // Save request in course
    await courseRef(courseId).child(`requests/${userId}`).set('pending');

    // Save request in user
    await db.ref(`users/${userId}/enrollRequests/${courseId}`).set('pending');

    return res.json({ success: true });
  } catch (err) {
    console.error('enrollCourse:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

