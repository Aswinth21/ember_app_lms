import Controller from '@ember/controller';
import { computed } from '@ember/object';
import ENV from 'lms-frontend/config/environment';

export default Controller.extend({
  course: null,
  currentUser: null,

  showDeleteConfirm: false,
  showDeleteSuccess: false,
  isDeleting: false,

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

    closeDeletePopup() {
      this.set('showDeleteConfirm', false);
    },

    async confirmDelete() {
      if (this.isDeleting) return;

      this.set('isDeleting', true);

      const res = await fetch(
        `${ENV.APP.API_HOST}/course/${this.course._id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      this.set('isDeleting', false);
      this.set('showDeleteConfirm', false);

      if (!res.ok) {
        alert('Delete failed'); 
        return;
      }

      this.set('showDeleteSuccess', true);
      setTimeout(() => {
        this.transitionToRoute('dashboard');
      }, 1000);
    },

    enroll() {
      this.transitionToRoute('courses.enroll', this.course._id);
    }
  }
});
