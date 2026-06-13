import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get JWT_SECRET() {
    return required("JWT_SECRET");
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || "7d";
  },
  get ADMIN_ACCESS_CODE() {
    return process.env.ADMIN_ACCESS_CODE || "kubedrill-admin";
  },
  get K8S_PROVISIONER_URL() {
    return process.env.K8S_PROVISIONER_URL;
  },
  get PORT() {
    return parseInt(process.env.PORT || "4000", 10);
  },
};
