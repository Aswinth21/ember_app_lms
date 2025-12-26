import Controller from "@ember/controller";
import { inject as service } from '@ember/service';

const API_HOST = "http://localhost:8000/api";

export default Controller.extend({
  session: service(),

  username: '',
  password: '',

  isLoading: false,
  statusMessage: null,
  statusClass: null,

  actions: {
    async login() {
      if (this.isLoading) return;

      this.setProperties({
        isLoading: true,
        statusMessage: null,
        statusClass: null
      });

      try {
        const res = await fetch(`${API_HOST}/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        });

        if (!res.ok) {
          throw new Error("LOGIN_FAILED");
        }

        await this.session.loadUser();

        if (!this.session.user) {
          throw new Error("LOGIN_FAILED");
        }

        this.setProperties({
          statusMessage: "Login successful. Redirecting to dashboard…",
          statusClass: "alert-success"
        });

        setTimeout(() => {
          this.transitionToRoute("dashboard");
        }, 800);

      } catch (e) {
        this.setProperties({
          statusMessage: "Invalid username or password.",
          statusClass: "alert-danger"
        });
      } finally {
        this.set('isLoading', false);
      }
    }
  }
});
