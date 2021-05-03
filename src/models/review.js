import mongoose from 'mongoose';

const { Schema } = mongoose;
const ReviewSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  applicant: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }, // 등급분류일자
  rating: String, // 등급
  code: String, // 분류번호
});

const Review = mongoose.model('Review', ReviewSchema);
export default Review;
