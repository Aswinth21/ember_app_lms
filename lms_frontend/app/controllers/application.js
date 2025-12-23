import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),

  get isAdmin() {
    return this.session.user?.role === 'admin';
  },

  actions: {
    goToCreate() {
      this.transitionToRoute('courses.create');
    },

    goToRequests() {
      this.transitionToRoute('courses.requests');
    }
  }
});
