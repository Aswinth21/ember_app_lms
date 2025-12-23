import { helper } from '@ember/component/helper';

export default helper(function objectLength([obj]) {
  return obj ? Object.keys(obj).length : 0;
});
