import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL,
});

Router.map(function () {
  this.route('index', { path: '/' });
  this.route('login');
  this.route('signup');
  this.route('dashboard');

  this.route('courses', function () {
    this.route('create');
    this.route('view', { path: '/:course_id' });
    this.route('edit', { path: '/:course_id/edit' });
    this.route('enroll', { path: '/:course_id/enroll' });
  });

  this.route('requests');
});

export default Router;
