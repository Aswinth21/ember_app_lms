import Service from '@ember/service';
import ENV from 'lms-frontend/config/environment';

export default Service.extend({
  user: null,
  isLoaded: false,

  async loadUser() {
    try {
      const res = await fetch(`${ENV.APP.API_HOST}/auth/user`, {
        credentials: 'include'
      });

      if (!res.ok) {
        this.setProperties({ user: null, isLoaded: true });
        return;
      }

      const data = await res.json();
      this.setProperties({
        user: data.user,
        isLoaded: true
      });
    } catch (e) {
      this.setProperties({ user: null, isLoaded: true });
    }
  },

  clear() {
    this.setProperties({ user: null, isLoaded: true });
  }
});
