import User from "../models/User.js";

/**
 * Ensures that a Super Admin account is available in the system.
 * 1. Upgrades webstique.dev@gmail.com (the owner/admin email) to superadmin if present.
 * 2. If no superadmin exists at all, provisions superadmin@precise3dm.com.
 */
export const ensureSuperAdmin = async () => {
  try {
    // 1. If webstique.dev@gmail.com exists, elevate to superadmin
    const webstiqueUser = await User.findOne({ email: "webstique.dev@gmail.com" });
    if (webstiqueUser && webstiqueUser.role !== "superadmin") {
      webstiqueUser.role = "superadmin";
      webstiqueUser.status = "approved";
      await webstiqueUser.save();
      console.log("[Auth] Promoted webstique.dev@gmail.com to Super Admin.");
    }

    // 2. Check if any superadmin account exists
    const superAdminExists = await User.findOne({ role: "superadmin" });
    if (!superAdminExists) {
      const defaultEmail = (process.env.SUPERADMIN_EMAIL || "superadmin@precise3dm.com").toLowerCase().trim();
      let defaultAdmin = await User.findOne({ email: defaultEmail });
      if (defaultAdmin) {
        defaultAdmin.role = "superadmin";
        defaultAdmin.status = "approved";
        await defaultAdmin.save();
        console.log(`[Auth] Existing user ${defaultEmail} upgraded to Super Admin.`);
      } else {
        await User.create({
          name: "Precise Super Admin",
          email: defaultEmail,
          password: process.env.SUPERADMIN_PASSWORD || "SuperAdmin@2026!",
          role: "superadmin",
          status: "approved",
          avatarColor: "#EA580C",
        });
        console.log(`[Auth] Provisioned default Super Admin account: ${defaultEmail}`);
      }
    }
  } catch (err) {
    console.warn("[Auth] Super Admin check warning:", err.message);
  }
};
