import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    async enroll(course) {
      if (!window.confirm('Send enrollment request?')) return;

      const res = await fetch(
        `http://127.0.0.1:8000/api/course/${course._id}/enroll`,
        { method: 'POST', credentials: 'include' }
      );

      if (!res.ok) {
        alert('Enrollment failed');
        return;
      }

      alert('Enrollment request sent');
      this.transitionToRoute('dashboard');
    },
  },
});
