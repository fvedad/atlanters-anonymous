import { get, post, put } from "./base";

export function getAllFeedback() {
  return get("/api/feedback").then(res => {
    return res;
  });
}

export function closeFeedback(feedbackId) {
  return put(`/api/feedback/${feedbackId}/close`).then(res => {
    return res;
  });
}

export function submitFeedback(data) {
  return post("/api/feedback", data).then(res => {
    return res;
  });
}

export function getFeedback(feedbackId) {
  return get(`/api/feedback/${feedbackId}`).then(res => {
    return res;
  });
}

export function getFeedbackMessages(feedbackId) {
  return get(`/api/feedback/${feedbackId}/messages`).then(res => {
    return res;
  });
}
