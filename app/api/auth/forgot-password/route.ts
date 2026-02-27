import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";
import { logInfo, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    const body = await request.json();
    const { email, locale = "en" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 3 requests per email per 15 minutes
    const emailRateLimit = checkRateLimit(`forgot-password:${normalizedEmail}`, {
      maxRequests: 3,
      windowMs: 15 * 60 * 1000,
    });

    if (emailRateLimit.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(emailRateLimit.resetIn / 1000)),
          },
        }
      );
    }

    // Also rate limit by IP: 10 requests per 15 minutes
    const ipRateLimit = checkRateLimit(`forgot-password-ip:${ip}`, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (ipRateLimit.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(ipRateLimit.resetIn / 1000)),
          },
        }
      );
    }

    // Find user by email (only users with passwords, not OAuth-only users)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, password: true },
    });

    // Always return 200 to prevent email enumeration
    if (!user || !user.password) {
      logInfo("Password reset requested for non-existent or OAuth-only email", {
        email: normalizedEmail,
      });
      return NextResponse.json({ message: "OK" });
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    // Send email with reset link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";
    const resetLink = `${baseUrl}/${locale}/reset-password?token=${token}`;

    const passwordResetSubjects: Record<string, string> = {
      en: "Reset your PredictFlow password",
      ko: "PredictFlow 비밀번호 재설정",
    };
    const emailSubject = passwordResetSubjects[locale] ?? passwordResetSubjects.en;

    await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      html: passwordResetEmailHtml({
        userName: user.name || "",
        resetLink,
      }),
    });

    logInfo("Password reset email sent", { email: normalizedEmail });

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    logError("Forgot password error", err, { ip });
    return NextResponse.json(
      { message: "OK" },
      { status: 200 }
    );
  }
}
