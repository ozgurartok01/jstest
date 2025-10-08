import { defineAbility } from '@casl/ability';
import type { User } from './auth';

const defineAbilityFor = (user: User) => defineAbility((can) => {
  can('read', 'User');
  if (user.role === 'admin') {
    can('manage', 'User');
  } else {
    can('update', 'User', { id: user.id });
    can('delete', 'User', { id: user.id });
  }
});

export type AppAbility = ReturnType<typeof defineAbilityFor>;
export default defineAbilityFor;
