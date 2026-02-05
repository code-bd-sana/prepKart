import { connectDB } from "@/lib/db";
import {
  sendSubscriptionNotificationToAdmin,
  sendSubscriptionWelcomeEmail,
} from "@/lib/email";
import Subscription from "@/models/Subscription";

export async function POST(request) {
  try {
    await connectDB();

    const { email, postalCode, name } = await request.json();

    // Validate input
    if (!email || !postalCode) {
      return Response.json(
        { success: false, error: "Email and postal code are required" },
        { status: 400 },
      );
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      email: email.toLowerCase(),
    });

    let subscription;

    if (existingSubscription) {
      if (existingSubscription.status === "active") {
        return Response.json(
          { success: false, error: "This email is already subscribed" },
          { status: 409 },
        );
      } else {
        // Reactivate unsubscribed user
        existingSubscription.status = "active";
        existingSubscription.postalCode = postalCode;
        if (name) existingSubscription.name = name;
        await existingSubscription.save();
        subscription = existingSubscription;
      }
    } else {
      // Create new subscription
      subscription = new Subscription({
        email: email.toLowerCase().trim(),
        postalCode: postalCode.trim(),
        name: name || "",
      });

      await subscription.save();
    }

    // Send emails in background
    sendSubscriptionWelcomeEmail({
      email: subscription.email,
      postalCode: subscription.postalCode,
      name: subscription.name,
    }).catch((error) => {
      console.error("Subscription email failed:", error);
    });

    // Send notification to admin
    sendSubscriptionNotificationToAdmin({
      email: subscription.email,
      postalCode: subscription.postalCode,
    }).catch((error) => {
      console.error("Admin notification failed:", error);
    });

    return Response.json(
      {
        success: true,
        message: "Successfully subscribed! Check your email for confirmation.",
        data: subscription,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Subscription error:", error);

    // Handle duplicate email error
    if (error.code === 11000) {
      return Response.json(
        { success: false, error: "This email is already subscribed" },
        { status: 409 },
      );
    }

    return Response.json(
      { success: false, error: "Failed to subscribe. Please try again." },
      { status: 500 },
    );
  }
}
