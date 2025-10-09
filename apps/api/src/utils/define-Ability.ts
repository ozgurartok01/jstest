import { defineAbility } from '@casl/ability';
import type { User } from './auth';

const defineAbilityFor = (user: User) => defineAbility((can, cannot) => {
  can('read', 'User');
  if (user.role === 'admin') {
    can('manage', 'User');
    can('manage', 'Email');
  } else {
    cannot('read', 'Email');
    can('update', 'User', ['name'], { id: user.id }); 
    can('delete', 'User', { id: user.id });
  }
});

export type AppAbility = ReturnType<typeof defineAbilityFor>;
export default defineAbilityFor;
