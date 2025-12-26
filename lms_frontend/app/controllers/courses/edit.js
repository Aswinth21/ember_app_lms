import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import ENV from 'lms-frontend/config/environment';

export default Controller.extend({
  session: service(),

  course: null,
  currentUserId: null,
  contentsList: null,
  allUsers: null,

  memberSearch: '',
  adminSearch: '',
  showConfirm: false,

  isAdmin: computed('course', 'currentUserId', function () {
    if (!this.course || !this.currentUserId) return false;
    if (this.course.creator === this.currentUserId) return true;
    return (this.course.admins || []).some(a => a._id === this.currentUserId);
  }),

  isReadOnly: computed('isAdmin', function () {
    return !this.isAdmin;
  }),

  initializeContents() {
    const contentsObj = this.course.contents || {};
    const list = Object.values(contentsObj).map(c => ({
      title: c.title,
      description: c.description,
      videoUrl: c.videoUrl,
      isNew: false
    }));

    list.push(this.emptyRow());
    this.set('contentsList', A(list));
  },

  emptyRow() {
    return { title: '', description: '', videoUrl: '', isNew: true };
  },

  async loadUsers() {
    const res = await fetch(`${ENV.APP.API_HOST}/auth/users`, {
      credentials: 'include'
    });
    if (!res.ok) return;
    this.set('allUsers', await res.json());
  },

  memberIds: computed('course.members.[]', function () {
    return this.course.members.map(m => m._id);
  }),

  adminIds: computed('course.admins.[]', function () {
    return this.course.admins.map(a => a._id);
  }),

  filteredStudents: computed(
    'memberSearch',
    'allUsers.[]',
    'memberIds.[]',
    function () {
      if (!this.allUsers) return [];
      const q = this.memberSearch.toLowerCase();

      return this.allUsers.filter(u =>
        u.role === 'student' &&
        !this.memberIds.includes(u._id) &&
        (
          u.name.toLowerCase().includes(q) ||
          u.registerNumber.toLowerCase().includes(q)
        )
      );
    }
  ),

  filteredAdmins: computed(
    'adminSearch',
    'allUsers.[]',
    'adminIds.[]',
    function () {
      if (!this.allUsers) return [];
      const q = this.adminSearch.toLowerCase();

      return this.allUsers.filter(u =>
        u.role === 'admin' &&
        !this.adminIds.includes(u._id) &&
        (
          u.name.toLowerCase().includes(q) ||
          u.registerNumber.toLowerCase().includes(q)
        )
      );
    }
  ),

  actions: {
    confirmAddContent(index) {
      const updated = this.contentsList.map((c, i) => {
        if (i === index) {
          return {
            title: c.title,
            description: c.description,
            videoUrl: c.videoUrl,
            isNew: false
          };
        }
        return c;
      });

      updated.push(this.emptyRow());
      this.set('contentsList', A(updated));
    },

    removeContent(index) {
      const updated = this.contentsList.filter((_, i) => i !== index);
      this.set('contentsList', A(updated));
    },

    addMember(user) {
      this.course.members.pushObject(user);
    },

    removeMember(user) {
      this.course.members.removeObject(user);
    },

    addAdmin(user) {
      this.course.admins.pushObject(user);
    },

    removeAdmin(user) {
      if (user._id === this.currentUserId) return;
      this.course.admins.removeObject(user);
    },

    confirmSave() {
      this.set('showConfirm', true);
    },

    cancelSave() {
      this.set('showConfirm', false);
    },

    async saveCourse() {
      const contents = this.contentsList
        .filter(c => !c.isNew)
        .map(c => ({
          title: c.title,
          description: c.description,
          videoUrl: c.videoUrl
        }));

      const payload = {
        name: this.course.name,
        description: this.course.description,
        contents,
        users: this.course.members.map(u => u._id),
        admins: this.course.admins.map(a => a._id)
      };

      const res = await fetch(
        `${ENV.APP.API_HOST}/course/${this.course._id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) return;

      this.transitionToRoute('courses.view', this.course._id);
    }
  }
});
