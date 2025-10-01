#!/usr/bin/env node
import { command, run, string, number, positional } from '@drizzle-team/brocli';
import { db } from './utils/db';
import { users, emails } from './schemas/schema';
import { eq, count } from 'drizzle-orm';

// Create user command
const createUser = command({
  name: 'create',
  shortDesc: 'Create a new user',
  options: {
    name: string().desc('User name').alias('n').required(),
    age: number().desc('User age').alias('a').required(),
    emailList: string().desc('Comma-separated emails').alias('e').required()
  },
  handler: async ({ name, age, emailList }) => {
    try {
      const emailArray = emailList.split(',').map(e => e.trim());
      
      const [user] = await db.insert(users)
        .values({ name, age })
        .returning();

      const emailsToInsert = emailArray.map((email, index) => ({
        userId: user.id,
        email,
        isPrimary: index === 0
      }));

      await db.insert(emails).values(emailsToInsert);
      
      console.log(`✅ User created: ${user.name} (${user.id})`);
      console.log(`📧 Emails: ${emailArray.join(', ')}`);
    } catch (error) {
      console.error('❌ Error creating user:', error);
    }
  }
});

// List users command
const listUsers = command({
  name: 'list',
  shortDesc: 'List all users',
  handler: async () => {
    try {
      const usersList = await db.query.users.findMany({
        with: {
          emails: {
            where: eq(emails.isDeleted, false),
            columns: { email: true, isPrimary: true }
          }
        }
      });

      if (usersList.length === 0) {
        console.log('📭 No users found');
        return;
      }

      console.log(`\n👥 Users:`);
      usersList.forEach(user => {
        const primaryEmail = user.emails.find(e => e.isPrimary)?.email || 'No email';
        console.log(`🆔 ${user.id} | 👤 ${user.name} (${user.age}) | 📧 ${primaryEmail}`);
      });
    } catch (error) {
      console.error('❌ Error listing users:', error);
    }
  }
});

// Get user by ID command
const getUser = command({
  name: 'get',
  shortDesc: 'Get user by ID',
  options: {
    id: string().desc('User ID').alias('i').required()
  },
  handler: async ({ id }) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          emails: {
            where: eq(emails.isDeleted, false)
          }
        }
      });

      if (!user) {
        console.log('❌ User not found');
        return;
      }

      console.log(`\n👤 User Details:`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🎂 Age: ${user.age}`);
      console.log(`📧 Emails:`);
      
      user.emails.forEach(email => {
        const primary = email.isPrimary ? ' (Primary)' : '';
        console.log(`   • ${email.email}${primary}`);
      });
    } catch (error) {
      console.error('❌ Error getting user:', error);
    }
  }
});

// Delete user command
const deleteUser = command({
  name: 'delete',
  shortDesc: 'Delete a user',
  options: {
    id: string().desc('User ID').alias('i').required()
  },
  handler: async ({ id }) => {
    try {
      await db.delete(emails).where(eq(emails.userId, id));
      const result = await db.delete(users).where(eq(users.id, id));
      
      if (result.changes === 0) {
        console.log('❌ User not found');
      } else {
        console.log('✅ User deleted successfully');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
    }
  }
});

// Stats command
const stats = command({
  name: 'stats',
  shortDesc: 'Show database statistics',
  handler: async () => {
    try {
      const [userCount] = await db.select({ count: count(users.id) }).from(users);
      const [emailCount] = await db.select({ count: count(emails.id) }).from(emails);
      
      console.log(`\n📊 Database Statistics:`);
      console.log(`👥 Total Users: ${userCount.count}`);
      console.log(`📧 Total Emails: ${emailCount.count}`);
    } catch (error) {
      console.error('❌ Error getting stats:', error);
    }
  }
});

run([createUser, listUsers, getUser, deleteUser, stats], {
  name: 'user-cli'
});