import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ENV from 'lms-frontend/config/environment';

export default Route.extend({
  session: service(),

  beforeModel() {
    const user = this.session.user;
    if (!user || user.role !== 'admin') {
      this.transitionTo('dashboard');
    }
  },

  async model() {
    const res = await fetch(`${ENV.APP.API_HOST}/auth/users`, {
      credentials: 'include',
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('FAILED_TO_LOAD_USERS');
    }

    const users = await res.json();

    return {
      users,
      course: {
        name: '',
        description: '',
        contents: [
          { title: '', description: '', videoUrl: '' }
        ]
      }
    };
  }
});
