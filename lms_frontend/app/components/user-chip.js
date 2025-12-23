import Component from '@ember/component';

export default Component.extend({
  actions: {
    remove(userId) {
      this.onRemove(userId);
    },
  },
});
