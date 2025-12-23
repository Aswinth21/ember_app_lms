import Route from '@ember/routing/route';

export default Route.extend({
  async model(params) {
    const res = await fetch(`http://127.0.0.1:8000/api/course/${params.course_id}`, {
      credentials: 'include',
      cache: 'no-store'
    });
    return await res.json();
  },
});
