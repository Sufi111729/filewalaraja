import {
  consumeVerifiedSignup,
  createUserLocal,
  findUserByEmail,
  setSignupOtp,
  toPublicUser,
  updateUserLocal,
  verifySignupOtpLocal
} from "./localUsersStore";

const EMAILJS_SERVICE_ID = String(import.meta.env.VITE_EMAILJS_SERVICE_ID || "").trim();
const EMAILJS_TEMPLATE_ID = String(import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "").trim();
const EMAILJS_PUBLIC_KEY = String(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "").trim();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createToken(email) {
  const payload = `${email}:${Date.now()}`;
  try {
    return btoa(payload);
  } catch {
    return `token-${Date.now()}`;
  }
}

async function sendOtpEmail({ email, otp, firstName, lastName }) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("OTP email service is not configured.");
  }

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        email,
        otp,
        first_name: firstName || "",
        last_name: lastName || "",
        app_name: "File Wala Raja"
      }
    })
  });

  if (!res.ok) {
    throw new Error("Failed to send OTP email. Please try again.");
  }
}

export async function signup(payload) {
  const user = createUserLocal({
    ...payload,
    emailVerified: false
  });
  return {
    ok: true,
    message: "Account created. Please verify your email.",
    user: toPublicUser(user)
  };
}

export async function sendSignupOtp(payload) {
  const firstName = String(payload?.firstName || "").trim();
  const lastName = String(payload?.lastName || "").trim();
  const email = normalizeEmail(payload?.email);
  if (!firstName) throw new Error("First name is required.");
  if (!lastName) throw new Error("Last name is required.");
  if (!email) throw new Error("Email is required.");

  const { otp } = setSignupOtp({ firstName, lastName, email });
  await sendOtpEmail({ email, otp, firstName, lastName });

  return {
    ok: true,
    email,
    message: `OTP sent to ${email}.`
  };
}

export async function verifySignupOtp(payload) {
  const email = normalizeEmail(payload?.email);
  const otp = String(payload?.otp || "").trim();
  if (!email) throw new Error("Email is required.");
  if (!otp) throw new Error("OTP is required.");
  verifySignupOtpLocal({ email, otp });
  return {
    ok: true,
    message: "OTP verified."
  };
}

export async function completeSignup(payload) {
  const email = normalizeEmail(payload?.email);
  consumeVerifiedSignup(email);
  const user = createUserLocal({
    firstName: payload?.firstName,
    lastName: payload?.lastName,
    email,
    mobile: payload?.mobile,
    password: payload?.password,
    emailVerified: true
  });
  return {
    ok: true,
    message: "Account created successfully.",
    user: toPublicUser(user)
  };
}

export async function login(payload) {
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");
  if (!email || !password) throw new Error("Email and password are required.");

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }
  if (!user.emailVerified) {
    throw new Error("Email is not verified.");
  }

  return {
    ok: true,
    token: createToken(email),
    email
  };
}

export async function verifyEmail(token) {
  const raw = String(token || "").trim();
  if (!raw) throw new Error("Verification token missing.");

  let email = raw;
  try {
    email = atob(raw).split(":")[0] || raw;
  } catch {
    email = raw;
  }

  const user = findUserByEmail(email);
  if (!user) throw new Error("User not found.");

  updateUserLocal(user.id, { emailVerified: true });
  return {
    ok: true,
    message: "Email verified."
  };
}

export async function resendVerification(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Email is required.");
  const user = findUserByEmail(normalizedEmail);
  if (user) throw new Error("Email is already registered.");

  const { otp } = setSignupOtp({ firstName: "", lastName: "", email: normalizedEmail });
  await sendOtpEmail({ email: normalizedEmail, otp, firstName: "", lastName: "" });
  return {
    ok: true,
    email: normalizedEmail,
    message: `OTP resent to ${normalizedEmail}.`
  };
}
