import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { toast } from "react-toastify";

export async function POST(request) {
  try {
    await connectDB();

    const { email, password, adminKey } = await request.json();

    if (!process.env.ADMIN_REGISTRATION_KEY) {
      return NextResponse.json(
        { error: "Admin registration not configured" },
        { status: 500 },
      );
    }

    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with ADMIN PRIVILEGES
    const adminUser = await User.create({
      email,
      password: hashedPassword,
      name: email.split("@")[0] || "Admin",
      province: "Ontario",
      tier: "admin",
      marketing_consent: false,
      monthly_plan_count: 0,
      weekly_plan_count: 0,
      ageVerified: true,
      age: 30,
      preferences: {
        dietaryPreferences: [],
        allergies: [],
        likes: [],
        dislikes: [],
        cookingMethod: [],
        skillLevel: "intermediate",
      },
      planGenerationCount: 0,
      swapsUsed: 0,
      swapsAllowed: 9999,
      emailVerified: true,
      isActive: true,
      subscription: {
        tier: "admin",
        status: "active",
      },
    });

    // toast.success("Admin account created successfully", adminUser.email);

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created with unlimited privileges",
        user: {
          email: adminUser.email,
          name: adminUser.name,
          tier: adminUser.tier,
          swapsAllowed: adminUser.swapsAllowed,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin registration error:", error);
    return NextResponse.json(
      {
        error: "Server error: " + error.message,
      },
      { status: 500 },
    );
  }
}
