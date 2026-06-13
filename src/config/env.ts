import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  ADMIN_ACCESS_CODE: process.env.ADMIN_ACCESS_CODE || "kubedrill-admin",
  K8S_PROVISIONER_URL: process.env.K8S_PROVISIONER_URL,
  PORT: parseInt(process.env.PORT || "4000", 10),
};
