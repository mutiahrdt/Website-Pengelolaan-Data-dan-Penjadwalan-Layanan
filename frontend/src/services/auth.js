// src/services/auth.js
import axios from 'axios';

export async function signIn(username, password) {
  const resp = await axios.post('/api/signin', { username, password });
  const { token, user } = resp.data.data;
  // simpan ke localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('role', user.role);
  return user.role;
}
