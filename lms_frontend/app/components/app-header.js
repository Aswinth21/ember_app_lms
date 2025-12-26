import Component from '@ember/component';
import { inject as service } from '@ember/service';
import ENV from 'lms-frontend/config/environment';

export default Component.extend({
  router: service(),
  session: service(),

  isLoggingOut: false,

  actions: {
    logout() {
      if (this.isLoggingOut) return;
      this.set('isLoggingOut', true);

      fetch(`${ENV.APP.API_HOST}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
        .finally(() => {
          this.set('isLoggingOut', false);
          window.location.href = '/'; 
        });
    },

    goBack() {
      this.router.transitionTo('dashboard');
    },

    
  }
});
