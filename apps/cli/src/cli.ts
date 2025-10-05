import { command, run, string, number } from "@drizzle-team/brocli";
import fetch from "node-fetch";

import logger from "./utils/logger";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

const parseEmailList = (emailList: string) =>
  emailList
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const buildHeaders = (requireAuth: boolean) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!requireAuth) {
    return headers;
  }

  const token = process.env.USER_CLI_TOKEN;
  if (!token) {
    console.error("Missing USER_CLI_TOKEN. Run 'user-cli login' and set the token before calling protected commands.");
    return null;
  }

  (headers as any).Authorization = `Bearer ${token}`;
  return headers;
};

const printUserSummary = (user: any) => {
  console.log(`User: ${user.name} (${user.id})`);

  if (user.emails && user.emails.length > 0) {
    const details = user.emails
      .map((entry: any) => `${entry.email}${entry.isPrimary ? " [primary]" : ""}`)
      .join(", ");
    console.log(`Emails: ${details}`);
  }
};

const createUser = command({
  name: "create",
  shortDesc: "Register a new user and receive an auth token",
  options: {
    name: string().desc("User name").alias("n").required(),
    age: number().desc("User age").alias("a").required(),
    emailList: string().desc("Comma-separated emails").alias("e").required(),
    password: string().desc("User password").alias("p").required(),
  },
  handler: async ({ name, age, emailList, password }) => {
    try {
      const emails = parseEmailList(emailList);

      if (emails.length === 0) {
        console.error("Provide at least one valid email.");
        return;
      }

      const response = await fetch(`${AUTH_BASE_URL}/register`, {
        method: "POST",
        headers: buildHeaders(false)!,
        body: JSON.stringify({ name, age, password, emails }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        logger.debug("Register failed", error);
        console.error("Error creating user:", error);
        return;
      }
      //type decleration
      const data = (await response.json()) as { token: string; user: any };
      printUserSummary(data.user);
      console.log(`Token: ${data.token}`);
      console.log("Set USER_CLI_TOKEN to this token to run authenticated commands.");
    } catch (error) {
      logger.error("CLI user create failed", error as any);
      logger.debug("Create debug info", { name, age, emailList });
      console.error("Error creating user:", error);
    }
  },
});

const loginUser = command({
  name: "login",
  shortDesc: "Authenticate and receive a JWT",
  options: {
    email: string().desc("Account email").alias("e").required(),
    password: string().desc("Account password").alias("p").required(),
  },
  handler: async ({ email, password }) => {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/login`, {
        method: "POST",
        headers: buildHeaders(false)!,
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        console.error("Login failed:", error);
        return;
      }

      const data = (await response.json()) as { token: string };
      console.log(`Token: ${data.token}`);
      console.log("Export USER_CLI_TOKEN with this token to access protected commands.");
    } catch (error) {
      logger.error("CLI login failed", error as any);
      logger.debug("Login debug info", { email });
      console.error("Error logging in:", error);
    }
  },
});

const listUsers = command({
  name: "list",
  shortDesc: "List all users",
  handler: async () => {
    try {
      const headers = buildHeaders(true);
      if (!headers) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users`, { headers: headers as any });

      if (!response.ok) {
        console.error("Error fetching users:", response.statusText);
        return;
      }

      const data = (await response.json()) as any;
      const users = Array.isArray(data) ? data : data.items;

      if (!users || users.length === 0) {
        console.log("No users found.");
        return;
      }

      users.forEach((user: any) => {
        printUserSummary(user);
      });
    } catch (error) {
      logger.error("CLI user list failed", error as any);
      logger.debug("List debug info", { endpoint: "/users" });
      console.error("Error listing users:", error);
    }
  },
});

const getUser = command({
  name: "get",
  shortDesc: "Get user by ID",
  options: {
    id: string().desc("User ID").alias("i").required(),
  },
  handler: async ({ id }) => {
    try {
      const headers = buildHeaders(true);
      if (!headers) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, { headers: headers as any });

      if (!response.ok) {
        if (response.status === 404) {
          console.log("User not found.");
        } else {
          console.error("Error fetching user:", response.statusText);
        }
        return;
      }

      const user = await response.json();
      printUserSummary(user);
    } catch (error) {
      logger.error("CLI user get failed", error as any);
      logger.debug("Get debug info", { id });
      console.error("Error getting user:", error);
    }
  },
});

const updateUser = command({
  name: "update",
  shortDesc: "Update a user",
  options: {
    id: string().desc("User ID").alias("i").required(),
    name: string().desc("User name").alias("n"),
    age: number().desc("User age").alias("a"),
  },
  handler: async ({ id, name, age }) => {
    try {
      const headers = buildHeaders(true);
      if (!headers) {
        return;
      }

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (typeof age === "number") updateData.age = age;

      if (Object.keys(updateData).length === 0) {
        console.log("Provide at least one field to update (use -n or -a).");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PATCH",
        headers: headers as any,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log("User not found.");
        } else {
          const error = await response.json().catch(() => ({ error: response.statusText }));
          console.error("Error updating user:", error);
        }
        return;
      }

      const result = await response.json();
      printUserSummary(result);
    } catch (error) {
      logger.error("CLI user update failed", error as any);
      logger.debug("Update debug info", { id, name, age });
      console.error("Error updating user:", error);
    }
  },
});

const deleteUser = command({
  name: "delete",
  shortDesc: "Delete a user",
  options: {
    id: string().desc("User ID").alias("i").required(),
  },
  handler: async ({ id }) => {
    try {
      const headers = buildHeaders(true);
      if (!headers) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: headers as any,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log("User not found.");
        } else {
          console.error("Error deleting user:", response.statusText);
        }
        return;
      }

      console.log("User deleted successfully.");
    } catch (error) {
      logger.error("CLI user delete failed", error as any);
      logger.debug("Delete debug info", { id });
      console.error("Error deleting user:", error);
    }
  },
});

run([createUser, loginUser, listUsers, getUser, updateUser, deleteUser], {
  name: "user-cli",
});

