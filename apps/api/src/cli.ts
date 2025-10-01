#!/usr/bin/env node
import { command, run, string, number } from '@drizzle-team/brocli';
import fetch from 'node-fetch';
import logger from './utils/logger';

const API_BASE_URL = 'http://localhost:3000';

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
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          age,
          emails: emailArray
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Error creating user:', error);
        return;
      }

      const user = await response.json() as any;
      console.log(`✅ User created: ${user.name} (${user.id})`);
      
      // Show emails from the created user response
      if (user.emails && user.emails.length > 0) {
        const emailList = user.emails.map((e: any) => e.email).join(', ');
        console.log(`📧 Emails: ${emailList}`);
      }
    } catch (error) {
      logger.error('CLI user creation failed:', error);
      logger.debug('Debug info:', { name, age, emailList });
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
      const response = await fetch(`${API_BASE_URL}/users`);
      
      if (!response.ok) {
        console.error('❌ Error fetching users');
        return;
      }

      const data = await response.json() as any;
      const usersList = data.items || data; // Handle paginated response

      if (!usersList || usersList.length === 0) {
        console.log('📭 No users found');
        return;
      }

      console.log(`\n👥 Users:`);
      usersList.forEach((user: any) => {
        // Get primary email or first email, or show 'No email'
        let emailDisplay = 'No email';
        if (user.emails && user.emails.length > 0) {
          const primaryEmail = user.emails.find((e: any) => e.isPrimary);
          emailDisplay = primaryEmail ? primaryEmail.email : user.emails[0].email;
        }
        
        console.log(`🆔 ${user.id} | 👤 ${user.name} (${user.age}) | 📧 ${emailDisplay}`);
      });
    } catch (error) {
      logger.error('CLI user list failed:', error);
      logger.debug('Debug info:', { endpoint: '/users' });
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
      const response = await fetch(`${API_BASE_URL}/users/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ User not found');
        } else {
          console.error('❌ Error fetching user');
        }
        return;
      }

      const user = await response.json() as any;

      console.log(`\n👤 User Details:`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🎂 Age: ${user.age}`);
      console.log(`📧 Emails:`);
      
      if (user.emails && user.emails.length > 0) {
        user.emails.forEach((email: any) => {
          const primary = email.isPrimary ? ' (Primary)' : '';
          console.log(`   • ${email.email}${primary}`);
        });
      } else {
        console.log('   No emails found');
      }
    } catch (error) {
      logger.error('CLI user get failed:', error);
      logger.debug('Debug info:', { id });
      console.error('❌ Error getting user:', error);
    }
  }
});

// Update user command
const updateUser = command({
  name: 'update',
  shortDesc: 'Update a user',
  options: {
    id: string().desc('User ID').alias('i').required(),
    name: string().desc('User name').alias('n'),
    age: number().desc('User age').alias('a')
  },
  handler: async ({ id, name, age }) => {
    try {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (age) updateData.age = age;

      if (Object.keys(updateData).length === 0) {
        console.log('❌ No fields to update. Use -n for name or -a for age');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ User not found');
        } else {
          const error = await response.json();
          console.error('❌ Error updating user:', error);
        }
        return;
      }

      const user = await response.json() as any;
      console.log(`✅ User updated: ${user.name} (${user.id})`);
      
      // Show emails if available
      if (user.emails && user.emails.length > 0) {
        const emailList = user.emails.map((e: any) => e.email).join(', ');
        console.log(`📧 Emails: ${emailList}`);
      }
    } catch (error) {
      logger.error('CLI user update failed:', error);
      logger.debug('Debug info:', { id, name, age });
      console.error('❌ Error updating user:', error);
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
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ User not found');
        } else {
          console.error('❌ Error deleting user');
        }
        return;
      }

      console.log('✅ User deleted successfully');
    } catch (error) {
      logger.error('CLI user delete failed:', error);
      logger.debug('Debug info:', { id });
      console.error('❌ Error deleting user:', error);
    }
  }
});

run([createUser, listUsers, getUser, updateUser, deleteUser], {
  name: 'user-cli'
});