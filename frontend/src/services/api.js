//import axios
import axios from "axios";

const Api = axios.create({
  //set default endpoint API
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

Api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default Api;
