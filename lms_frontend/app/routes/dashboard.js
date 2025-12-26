import Route from '@ember/routing/route';
import ENV from 'lms-frontend/config/environment';

export default Route.extend({
  async model() {
    const userRes = await fetch(`${ENV.APP.API_HOST}/auth/user`, {
      credentials: 'include',
      cache: 'no-store'
    });

    if (!userRes.ok) {
      this.transitionTo('login');
      return;
    }

    const { user } = await userRes.json();

    const courseRes = await fetch(`${ENV.APP.API_HOST}/course`, {
      credentials: 'include',
      cache: 'no-store'
    });

    if (!courseRes.ok) {
      throw new Error('COURSES_FETCH_FAILED');
    }

    const courses = await courseRes.json();

    const myCourses = [];
    const otherCourses = [];

    courses.forEach(course => {
      const requests = course.requests || {};
      const isEnrolled = Boolean(user.courses?.[course._id]);
      const isRequestPending = Boolean(requests[user._id]);

      if (isEnrolled) {
        myCourses.push({
          ...course,
          role: user.courses[course._id].role
        });
      } else {
        otherCourses.push({
          ...course,
          requestPending: isRequestPending
        });
      }
    });

    return { user, myCourses, otherCourses };
  },

  setupController(controller, model) {
    this._super(controller, model);
    controller.setProperties(model);
  },

  actions: {
    logout() {
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
    },

    refreshModel() {
      this.refresh();
    }
  }
});
