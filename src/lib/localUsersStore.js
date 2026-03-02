const USERS_KEY = "fwr_users_db_v1";
const NEXT_ID_KEY = "fwr_users_next_id_v1";
const OTP_KEY = "fwr_signup_otp_v1";
const OTP_TTL_MS = 10 * 60 * 1000;

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readJson(key, fallback) {
  if (!hasStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  return safeParse(raw, fallback);
}

function writeJson(key, value) {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeMobile(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 15);
}

function validateBasicUserFields({ firstName, lastName, email, mobile, password }, allowEmptyPassword = false) {
  if (!String(firstName || "").trim()) throw new Error("First name is required.");
  if (!String(lastName || "").trim()) throw new Error("Last name is required.");

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Valid email is required.");

  const normalizedMobile = normalizeMobile(mobile);
  if (normalizedMobile && (normalizedMobile.length < 10 || normalizedMobile.length > 15)) {
    throw new Error("Mobile must be 10 to 15 digits.");
  }

  if (!allowEmptyPassword || String(password || "").length > 0) {
    if (String(password || "").length < 8) throw new Error("Password must be at least 8 characters.");
  }
}

function getUsersRaw() {
  const users = readJson(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

function saveUsersRaw(users) {
  writeJson(USERS_KEY, users);
}

function nextUserId() {
  const current = Number(readJson(NEXT_ID_KEY, 1));
  const next = Number.isFinite(current) && current > 0 ? current : 1;
  writeJson(NEXT_ID_KEY, next + 1);
  return next;
}

function createOtp() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(arr[0] % 1000000).padStart(6, "0");
  }
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function readOtpMap() {
  const otpMap = readJson(OTP_KEY, {});
  return otpMap && typeof otpMap === "object" ? otpMap : {};
}

function saveOtpMap(otpMap) {
  writeJson(OTP_KEY, otpMap);
}

function removeExpiredOtpEntries(otpMap) {
  const now = Date.now();
  const next = { ...otpMap };
  Object.keys(next).forEach((email) => {
    if (!next[email] || next[email].expiresAt <= now) {
      delete next[email];
    }
  });
  return next;
}

export function toPublicUser(user) {
  const firstName = String(user.firstName || "").trim();
  const lastName = String(user.lastName || "").trim();
  return {
    id: user.id,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email: normalizeEmail(user.email),
    mobile: normalizeMobile(user.mobile),
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function getAllUsers() {
  return getUsersRaw().sort((a, b) => Number(a.id) - Number(b.id));
}

export function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return getAllUsers().find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

export function createUserLocal(payload) {
  validateBasicUserFields(payload);

  const normalizedEmail = normalizeEmail(payload.email);
  if (findUserByEmail(normalizedEmail)) {
    throw new Error("User already exists with this email.");
  }

  const now = new Date().toISOString();
  const users = getAllUsers();
  const user = {
    id: nextUserId(),
    firstName: String(payload.firstName || "").trim(),
    lastName: String(payload.lastName || "").trim(),
    email: normalizedEmail,
    mobile: normalizeMobile(payload.mobile),
    password: String(payload.password || ""),
    emailVerified: Boolean(payload.emailVerified),
    createdAt: now,
    updatedAt: now
  };
  users.push(user);
  saveUsersRaw(users);
  return user;
}

export function updateUserLocal(id, payload) {
  const users = getAllUsers();
  const idx = users.findIndex((user) => String(user.id) === String(id));
  if (idx === -1) throw new Error("User not found.");

  const current = users[idx];
  const merged = {
    ...current,
    firstName: payload.firstName ?? current.firstName,
    lastName: payload.lastName ?? current.lastName,
    email: payload.email ?? current.email,
    mobile: payload.mobile ?? current.mobile,
    emailVerified: payload.emailVerified ?? current.emailVerified
  };

  if (payload.password !== undefined && payload.password !== null && payload.password !== "") {
    merged.password = String(payload.password);
  }

  validateBasicUserFields(
    {
      firstName: merged.firstName,
      lastName: merged.lastName,
      email: merged.email,
      mobile: merged.mobile,
      password: merged.password
    },
    true
  );

  const normalizedEmail = normalizeEmail(merged.email);
  const collision = users.find(
    (user) => String(user.id) !== String(id) && normalizeEmail(user.email) === normalizedEmail
  );
  if (collision) {
    throw new Error("Another user already uses this email.");
  }

  const updated = {
    ...merged,
    email: normalizedEmail,
    mobile: normalizeMobile(merged.mobile),
    updatedAt: new Date().toISOString()
  };
  users[idx] = updated;
  saveUsersRaw(users);
  return updated;
}

export function deleteUserLocal(id) {
  const users = getAllUsers();
  const nextUsers = users.filter((user) => String(user.id) !== String(id));
  if (nextUsers.length === users.length) throw new Error("User not found.");
  saveUsersRaw(nextUsers);
}

export function setSignupOtp({ firstName, lastName, email }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Email is required.");
  if (findUserByEmail(normalizedEmail)) throw new Error("User already exists with this email.");

  const otpMap = removeExpiredOtpEntries(readOtpMap());
  const existing = otpMap[normalizedEmail] || {};
  const otp = createOtp();
  otpMap[normalizedEmail] = {
    firstName: String(firstName || existing.firstName || "").trim(),
    lastName: String(lastName || existing.lastName || "").trim(),
    otp,
    verified: false,
    expiresAt: Date.now() + OTP_TTL_MS
  };
  saveOtpMap(otpMap);
  return { email: normalizedEmail, otp };
}

export function verifySignupOtpLocal({ email, otp }) {
  const normalizedEmail = normalizeEmail(email);
  const otpMap = removeExpiredOtpEntries(readOtpMap());
  const entry = otpMap[normalizedEmail];
  if (!entry) {
    saveOtpMap(otpMap);
    throw new Error("OTP expired or not found. Please resend OTP.");
  }
  if (String(entry.otp) !== String(otp || "").trim()) {
    throw new Error("Invalid OTP.");
  }
  otpMap[normalizedEmail] = { ...entry, verified: true };
  saveOtpMap(otpMap);
}

export function consumeVerifiedSignup(email) {
  const normalizedEmail = normalizeEmail(email);
  const otpMap = removeExpiredOtpEntries(readOtpMap());
  const entry = otpMap[normalizedEmail];
  if (!entry || !entry.verified) {
    saveOtpMap(otpMap);
    throw new Error("OTP not verified. Please verify OTP first.");
  }
  delete otpMap[normalizedEmail];
  saveOtpMap(otpMap);
}
