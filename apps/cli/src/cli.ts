import { command, run, string, number } from "@drizzle-team/brocli";
import fetch from "node-fetch";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

import logger from "./utils/logger";

type UserListResponse = {
  page: number;
  limit: number;
  total: number;
  items: any[];
};

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const CONFIG_DIR = path.join(os.homedir(), ".user-cli");
const TOKEN_FILE = path.join(CONFIG_DIR, "token");
let tokenCache: string | null | undefined;

const ensureConfigDir = () => {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
};

const saveToken = (token: string) => {
  try {
    ensureConfigDir();
    writeFileSync(TOKEN_FILE, token, "utf-8");
    tokenCache = token;
  } catch (error) {
    logger.warn("Failed to persist CLI token", { error });
  }
};

const loadToken = (): string | null => {
  if (typeof tokenCache === "string") {
    return tokenCache;
  }

  try {
    const token = readFileSync(TOKEN_FILE, "utf-8").trim();
    tokenCache = token || null;
    return tokenCache;
  } catch {
    tokenCache = null;
    return null;
  }
};

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

  const token = process.env.USER_CLI_TOKEN ?? loadToken();
  if (!token) {
    console.error(
      "Missing USER_CLI_TOKEN. Run 'user-cli login' or 'user-cli create' to get a token."
    );
    console.error(`If the CLI saved a token, check ${TOKEN_FILE}`);
    return null;
  }

  headers.Authorization = `Bearer ${token}`;
  return headers;
};

const printUserSummary = (user: any) => {
  console.log(`User: ${user.name} (${user.id})${user.age !== undefined ? ` - age ${user.age}` : ""}`);

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
    role: string().desc("User role (admin or customer)").alias("r").required(),
  },
  handler: async ({ name, age, emailList, role }) => {
    try {
      const emails = parseEmailList(emailList);

      if (emails.length === 0) {
        console.error("Provide at least one valid email.");
        return;
      }

      const response = await fetch(`${AUTH_BASE_URL}/register`, {
        method: "POST",
        headers: buildHeaders(false)!,
        body: JSON.stringify({ name, age, emails, role }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        logger.debug("Register failed", error);
        console.error("Error creating user:", error);
        return;
      }

      const data = (await response.json()) as { token: string; user: any };
      saveToken(data.token);
      process.env.USER_CLI_TOKEN = data.token;
      printUserSummary(data.user);
      console.log(`Token: ${data.token}`);
      console.log(`Token saved to ${TOKEN_FILE}. Future commands auto-load it.`);
    } catch (error) {
      logger.error("CLI user create failed", error as any);
      logger.debug("Create debug info", { name, age, emailList, role });
      console.error("Error creating user:", error);
    }
  },
});

const loginUser = command({
  name: "login",
  shortDesc: "Authenticate and receive a JWT",
  options: {
    email: string().desc("Account email").alias("e").required(),
  },
  handler: async ({ email }) => {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/login`, {
        method: "POST",
        headers: buildHeaders(false)!,
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        console.error("Login failed:", error);
        return;
      }

      const data = (await response.json()) as { token: string, user: any };
      saveToken(data.token);
      process.env.USER_CLI_TOKEN = data.token;
      console.log(`Token: ${data.token}`);
      console.log(`Token saved to ${TOKEN_FILE}. Future commands auto-load it.`);
      console.log("-----");
      console.log(`User: ${data.user.name}`);
      console.log(`Logged as: ${data.user.role}`);
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
  options: {
    page: number().desc("Page number").default(1),
    limit: number().desc("Page size").default(10),
  },
  handler: async ({ page, limit }) => {
    try {
      const headers = buildHeaders(true);
      if (!headers) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users?page=${page}&limit=${limit}`, {
        headers: headers as any,
      });

      if (!response.ok) {
        console.error("Error fetching users:", response.statusText);
        return;
      }

      const payload = (await response.json()) as UserListResponse | any[];
      const items = Array.isArray(payload) ? payload : payload.items ?? [];

      if (items.length === 0) {
        console.log("No users found.");
        return;
      }

      if (!Array.isArray(payload)) {
        console.log(`Page ${payload.page} / Limit ${payload.limit} / Total ${payload.total}`);
      }

      for (const user of items) {
        printUserSummary(user);
        console.log("---");
      }
    } catch (error) {
      logger.error("CLI user list failed", error as any);
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

      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        headers: headers as any,
      });

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
          const error = await response
            .json()
            .catch(() => ({ error: response.statusText }));
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
