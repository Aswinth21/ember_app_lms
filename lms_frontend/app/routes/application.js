import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  session: service(),

  async beforeModel() {
    if(this.session.user)
    {
      this.transitionTo("dashboard");
    }
  },
  actions: {
    logoutFunc() {
      console.log("working");
      if (this.isLoggingOut) return;

      this.set('isLoggingOut', true);

      fetch(`${ENV.APP.API_HOST}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).finally(() => {
        this.set('isLoggingOut', false);
        this.transitionTo('/');
      });
    }
  }
});
