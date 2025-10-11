import fs from "fs";
import path from "path";
import { config } from "dotenv";

const envCandidates = [
  path.resolve(__dirname, "../../../../.env"),
  path.resolve(__dirname, "../../../.env"),
  path.resolve(process.cwd(), ".env"),
];

let loaded = false;

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    const result = config({ path: candidate });
    if (!result.error) {
      loaded = true;
      break;
    }
  }
}

if (!loaded) {
  config();
}

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is required. Set it in your environment or .env file.",
  );
}

export const env = {
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN ?? "1h",
};
