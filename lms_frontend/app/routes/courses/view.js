// app/routes/courses/view.js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

const API_HOST = 'http://localhost:8000/api';

export default Route.extend({
  session: service(),

  async model(params) {
    const courseRes = await fetch(
      `${API_HOST}/course/${params.course_id}`,
      {
        credentials: 'include',
        cache: 'no-store'
      }
    );

    if (!courseRes.ok) {
      throw new Error('FAILED_TO_LOAD');
    }

    const course = await courseRes.json();

    return {
      course,
      currentUser: this.session.user
    };
  },

  setupController(controller, model) {
    this._super(controller, model);
    controller.setProperties(model);
  },

  actions: {
    error() {
      this.transitionTo('dashboard');
      return false;
    }
  }
});
