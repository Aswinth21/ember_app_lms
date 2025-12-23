import Controller from '@ember/controller';

export default Controller.extend({
  username: '',
  email: '',
  password: '',
  role: 'student',
  name: '',
  contact: '',
  department: '',
  registerNumber: '',
  error: null,
  loading: false,

  actions: {
    async signup() {
      this.setProperties({ error: null, loading: true });

      try {
        const res = await fetch('http://127.0.0.1:8000/api/auth/signup', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            email: this.email,
            password: this.password,
            role: this.role,
            name: this.name,
            contact: this.contact,
            department: this.department,
            registerNumber: this.registerNumber,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Signup failed');
        }

        this.transitionToRoute('login');
      } catch (err) {
        this.set('error', err.message);
      } finally {
        this.set('loading', false);
      }
    },
  },
});
