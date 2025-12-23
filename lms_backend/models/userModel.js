import mongoose from "mongoose";

const { Schema } = mongoose;

const CourseRefSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin", "creator"],
      default: "student",
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "student"],
      default: "student",
    },

    name: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "default.jpg",
    },

    contact: {
      type: String,
      required: true,
      unique: true,
    },

    department: {
      type: String,
      required: true,
    },

    registerNumber: {
      type: String,
      required: true,
      unique: true,
    },

    courses: [CourseRefSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("coursesInfo", {
  ref: "Course",
  localField: "courses.course",
  foreignField: "_id",
  justOne: false,
});

userSchema.index({ "courses.course": 1 });

export default mongoose.model("User", userSchema);
