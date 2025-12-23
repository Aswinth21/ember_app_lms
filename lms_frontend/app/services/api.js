// app/services/api.js
import Service from '@ember/service';

export default Service.extend({
  baseUrl: 'http://127.0.0.1:8000/api',

  request(url, options = {}) {
    return fetch(`${this.baseUrl}${url}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    }).then(r => r.json());
  },

  getCourse(id) {
    return this.request(`/course/${id}`);
  },

  createCourse(data) {
    return this.request('/course', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCourse(id, data) {
    return this.request(`/course/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
});
