import Controller from '@ember/controller';
import ENV from 'lms-frontend/config/environment';

export default Controller.extend({
  actions: {
    logout() {
          if (this.isLoggingOut) return;
    
          this.set('isLoggingOut', true);
    
          fetch(`${ENV.APP.API_HOST}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
          }).finally(() => {
            this.set('isLoggingOut', false);
            this.transitionToRoute('login');
          });
        },
    async approve(request) {
      await fetch(
        `${ENV.APP.API_HOST}/course/${request.courseId}/requests/${request.studentId}/accept`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );
      this.send('refreshModel');
    },

    async reject(request) {
      await fetch(
        `${ENV.APP.API_HOST}/course/${request.courseId}/requests/${request.studentId}/reject`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );
      this.send('refreshModel');
    }
  }
});
