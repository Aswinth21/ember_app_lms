import { helper } from '@ember/component/helper';

export default helper(function inc([value]) {
  return value + 1;
});
