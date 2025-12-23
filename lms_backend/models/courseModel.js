import mongoose from "mongoose";

const { Schema } = mongoose;

const contentSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const requestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { _id: true }
);

const courseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    contents: [contentSchema],
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    requests: [requestSchema],
  },
  { timestamps: true }
);

courseSchema.pre("save", function (next) {
  if (this.creator && !this.admins.includes(this.creator)) {
    this.admins.push(this.creator);
  }
  next();
});

export default mongoose.model("Course", courseSchema);
