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

  async model(params) {
    const res = await fetch(
      `${ENV.APP.API_HOST}/course/${params.course_id}`,
      { credentials: 'include', cache: 'no-store' }
    );

    if (!res.ok) {
      this.transitionTo('dashboard');
      return;
    }

    return await res.json();
  },

  setupController(controller, model) {
    this._super(controller, model);

    controller.set('course', model);
    controller.set('currentUserId', this.session.user._id);
    const parentController = this.controllerFor('courses.view');
    controller.set('currentUser', parentController.currentUser);
    console.log(parentController.currentUser);
    controller.initializeContents();
    controller.loadUsers();
  }
});
