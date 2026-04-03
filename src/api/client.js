import axios from "axios";

const client = axios.create({
  baseURL: "/api"
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

export function setToken(token) {
  if (!token) {
    delete client.defaults.headers.common.Authorization;
    return;
  }
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export default client;