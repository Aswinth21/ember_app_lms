import { helper } from '@ember/component/helper';

export default helper(function hasRole([userRole, allowedRoles]) {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
});
