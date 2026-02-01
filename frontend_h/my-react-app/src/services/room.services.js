import api from "./api";

export const getallrooms = () => {
  return api.get("/rooms/getallrooms");
}
export const createRoom = (payload) => {
  return api.post("/rooms/create", payload);
}
export const updateRoom = (roomId, payload) => {
  return api.put(`/rooms/${roomId}/update`, payload);
}
export const deleteRoom = (roomId) => {
  return api.delete(`/rooms/${roomId}/delete`);
}
