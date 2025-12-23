import { helper } from '@ember/component/helper';

export default helper(function keys([obj]) {
  return obj ? Object.keys(obj) : [];
});
