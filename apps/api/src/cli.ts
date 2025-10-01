#!/usr/bin/env node
import { command, run, string, number } from '@drizzle-team/brocli';
import { create } from './routes/user/create';

// Mock Express Request and Response objects for CLI
const createMockReq = (body: any) => ({
  body,
  params: {},
  query: {}
} as any);

const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.data = data;
      return this;
    },
    send: function() {
      return this;
    }
  };
  return res as any;
};

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
      
      // Create mock request and response
      const req = createMockReq({
        name,
        age,
        emails: emailArray
      });
      const res = createMockRes();

      // Call your API route function directly
      await create(req, res);

      // Handle the response
      if (res.statusCode === 201) {
        const user = res.data;
        console.log(`✅ User created: ${user.name} (${user.id})`);
        console.log(`📧 Emails: ${emailArray.join(', ')}`);
      } else {
        console.error('❌ Error creating user:', res.data);
      }
    } catch (error) {
      console.error('❌ Error creating user:', error);
    }
  }
});

run([createUser], {
  name: 'user-cli'
});