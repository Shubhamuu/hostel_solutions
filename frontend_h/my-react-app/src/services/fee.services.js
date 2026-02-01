import api from "./api";

export const getStudentFees = () => {
  return api.get("/fees/student");
};

export const payFee = (payload) => {
  return api.post("/fees/pay", payload);
};
export const getAllFees = () => {
  return api.get("/fees/all");
}
export const updateFeeStatus = (feeId, status) => {
  return api.put(`/fees/${feeId}/status`, { status });
};