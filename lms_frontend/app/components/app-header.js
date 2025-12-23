import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  router: service(),

  showBack: false,
  title: 'LMS',

  actions: {
    goBack() {
      this.router.transitionTo('dashboard');
    },

    logout() {
      this.onLogout?.();
    }
  }
});
