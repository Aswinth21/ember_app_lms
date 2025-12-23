import Route from '@ember/routing/route';
import ENV from 'lms-frontend/config/environment';

export default Route.extend({
  async model() {
    const userRes = await fetch(`${ENV.APP.API_HOST}/auth/user`, {
      credentials: 'include'
    });

    if (!userRes.ok) {
      this.transitionTo('login');
      return;
    }

    const { user } = await userRes.json();

    const courseRes = await fetch(`${ENV.APP.API_HOST}/course`, {
      credentials: 'include'
    });

    const courses = await courseRes.json();

    const usersRes = await fetch(`${ENV.APP.API_HOST}/auth/users`, {
      credentials: 'include'
    });

    const users = await usersRes.json();

    const userMap = {};
    users.forEach(u => {
      userMap[u._id] = u;
    });

    const requests = [];

    courses.forEach(course => {
      if (!course.requests) return;

      Object.entries(course.requests).forEach(([studentId, req]) => {
        if (req.status !== 'pending') return;

        const student = userMap[studentId];

        if (!student) return;

        requests.push({
          courseId: course._id,
          courseName: course.name,
          studentId,
          studentName: student.name,
          registerNumber: student.registerNumber
        });
      });
    });

    return { user, requests };
  },
  actions:{
    refreshModel(){
      this.refresh();
    }
  }
});
