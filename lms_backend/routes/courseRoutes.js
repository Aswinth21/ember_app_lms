import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

import {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourse,
  listCourses,
  requestEnroll,
  listCourseRequests,
  acceptRequest,
  rejectRequest,
  handleEnrollmentRequest,
  enrollCourse
} from "../controllers/courseController.js";

const router = express.Router();

/* ---------- COURSE ROUTES ---------- */

router.post("/", protectRoute, createCourse);
router.get("/", protectRoute, listCourses);
router.get("/:courseId", protectRoute, getCourse);
router.patch("/:courseId", protectRoute, updateCourse);
router.delete("/:courseId", protectRoute, deleteCourse);

// ENROLL REQUESTS
router.post('/:courseId/enroll', protectRoute, requestEnroll);
router.get('/:courseId/requests', protectRoute, listCourseRequests);
router.post('/:courseId/requests/:userId/accept', protectRoute, acceptRequest);
router.post('/:courseId/requests/:userId/reject', protectRoute, rejectRequest);
router.patch(
  "/:courseId/requests/:userId",
  protectRoute,
  handleEnrollmentRequest
);
router.post(
  "/:courseId/enroll",
  protectRoute,
  enrollCourse
);


export default router;
