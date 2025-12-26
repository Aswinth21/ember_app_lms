import Controller from '@ember/controller';
import { computed } from '@ember/object';
import ENV from 'lms-frontend/config/environment';

export default Controller.extend({
  user: null,
  myCourses: [],
  otherCourses: [],
  testValue : 'Initial value',  

  showEnrollPopup: false,
  selectedCourse: null,
  isLoggingOut: false,

  isAdmin: computed('user.role', function () {
    return this.user?.role === 'admin';
  }),

  deactivate()
  {
    console.log(this.testValue);
  },

  actions: {
    updateTestValue(value) {
      console.log('Controller received:', value);
      this.set('testValue', value);
    },

    logout() {
      if (this.isLoggingOut) return;

      this.set('isLoggingOut', true);

      fetch(`${ENV.APP.API_HOST}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).finally(() => {
        this.set('isLoggingOut', false);
        this.transitionToRoute('/');
      });
    },

    goToCreate() {
      this.transitionToRoute('courses.create');
    },

    goToRequests() {
      this.transitionToRoute('requests');
    },

    openEnrollPopup(course) {
      this.set('selectedCourse', course);
      this.set('showEnrollPopup', true);
    },

    closeEnrollPopup() {
      this.set('showEnrollPopup', false);
      this.set('selectedCourse', null);
    },

    async confirmEnroll() {
      const course = this.selectedCourse;

      await fetch(
        `${ENV.APP.API_HOST}/course/${course._id}/enroll`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      this.set('showEnrollPopup', false);
      this.set('selectedCourse', null);

      this.send('refreshModel');
    }
  }
});
