import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/lib/models/User";
export {
  createSessionToken,
  verifySessionToken,
  AUTH_COOKIE_NAME,
} from "@/lib/session";

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "creativetpr@gmail.com";
const DEFAULT_ADMIN_PASS = process.env.DEFAULT_ADMIN_PASS || "ay9344216902";

export async function seedAdminUser() {
  await dbConnect();
  const emailLower = DEFAULT_ADMIN_EMAIL.toLowerCase();
  let user = await User.findOne({ email: emailLower });

  if (!user) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);
    user = await User.create({
      name: "Creative Line Admin",
      email: emailLower,
      password: hashedPassword,
      role: "admin",
    });
  }

  return user;
}
