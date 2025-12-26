import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import ENV from 'lms-frontend/config/environment';

export default Controller.extend({
  session: service(),

  memberSearch: '',
  adminSearch: '',
  selectedMembers: null,
  selectedAdmins: null,

  init() {
    this._super(...arguments);
    this.set('selectedMembers', []);
    this.set('selectedAdmins', []);
  },

  course: computed.reads('model.course'),

  currentUserId: computed('session.user._id', function () {
    return this.session.user?._id;
  }),

  filteredMembers: computed(
    'memberSearch',
    'model.users',
    'selectedMembers.[]',
    'currentUserId',
    function () {
      const q = this.memberSearch.toLowerCase();
      const currentUserId = this.currentUserId;

      return this.model.users.filter(u =>
        u.role === 'student' &&                      
        u._id !== currentUserId &&                   
        !this.selectedMembers.find(m => m._id === u._id) &&
        (
          u.name.toLowerCase().includes(q) ||
          u.registerNumber.toLowerCase().includes(q)
        )
      );
    }
  ),

  filteredAdmins: computed(
    'adminSearch',
    'model.users',
    'selectedAdmins.[]',
    function () {
      const q = this.adminSearch.toLowerCase();

      return this.model.users.filter(u =>
        u.role === 'admin' &&
        !this.selectedAdmins.find(a => a._id === u._id) &&
        (
          u.name.toLowerCase().includes(q) ||
          u.registerNumber.toLowerCase().includes(q)
        )
      );
    }
  ),

  actions: {
    addContent() {
      this.course.contents.pushObject({
        title: '',
        description: '',
        videoUrl: ''
      });
    },

    removeContent(index) {
      this.course.contents.removeAt(index);
    },

    addMember(user) {
      this.selectedMembers.pushObject(user);
    },

    removeMember(user) {
      this.selectedMembers.removeObject(user);
    },

    addAdmin(user) {
      this.selectedAdmins.pushObject(user);
    },

    removeAdmin(user) {
      this.selectedAdmins.removeObject(user);
    },

    async createCourse() {
      if (!this.course.name.trim()) {
        alert('Course name is required');
        return;
      }

      const currentUserId = this.currentUserId;

      await fetch(`${ENV.APP.API_HOST}/course`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.course.name.trim(),
          description: this.course.description,
          contents: this.course.contents.filter(c => c.title.trim()),

          users: this.selectedMembers
            .filter(u => u._id !== currentUserId)
            .map(u => u._id),
          admins: this.selectedAdmins.map(u => u._id)
        })
      });

      this.transitionToRoute('dashboard');
    }
  }
});
