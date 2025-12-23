import Controller from "@ember/controller";
import { inject as service } from '@ember/service';

const API_HOST = "http://localhost:8000/api";

export default Controller.extend({
  session: service(),

  actions: {
    async login() {
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
        alert("Login failed");
        return;
      }

      await this.session.loadUser();

      if (this.session.user) {
        this.transitionToRoute("dashboard");
      } else {
        alert("Login failed");
      }
    }
  }
});
