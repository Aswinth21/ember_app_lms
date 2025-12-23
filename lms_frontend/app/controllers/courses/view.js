import Controller from '@ember/controller';
import { computed } from '@ember/object';
import ENV from 'lms-frontend/config/environment';

export default Controller.extend({
  course: null,
  currentUser: null,

  isAdmin: computed('course.admins.[]', 'currentUser._id', function () {
    if (!this.currentUser || !this.course?.admins) return false;
    return this.course.admins.some(a => a._id === this.currentUser._id);
  }),

  isMember: computed('course.members.[]', 'currentUser._id', function () {
    if (!this.currentUser || !this.course?.members) return false;
    return this.course.members.some(m => m._id === this.currentUser._id);
  }),

  actions: {
    goToEdit() {
      this.transitionToRoute('courses.edit', this.course._id);
    },

    async deleteCourse() {
        if (!confirm('Delete this course permanently?')) return;

        const res = await fetch(
        `${ENV.APP.API_HOST}/course/${this.course._id}`,
        {
            method: 'DELETE',
            credentials: 'include'
        }
        );

        if (!res.ok) {
            alert('Delete failed');
            return;
        }

        alert('Course deleted');
        this.transitionToRoute('dashboard');
  },

    enroll() {
      this.transitionToRoute('courses.enroll', this.course._id);
    }
  }
});
