// Centralised access to environment variables with light validation.
// Throws early (server-side) when a required secret is missing in production.

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return fallback ?? "";
  }
  return value;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  jwtSecret: required("JWT_SECRET", "dev-insecure-jwt-secret"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  appSecret: required("APP_SECRET", "dev-insecure-app-secret"),

  square: {
    environment: (process.env.SQUARE_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    accessToken: process.env.SQUARE_ACCESS_TOKEN || "",
    locationId: process.env.SQUARE_LOCATION_ID || ""
  },

  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucket: process.env.S3_BUCKET || "",
    publicUrl: process.env.S3_PUBLIC_URL || ""
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.EMAIL_FROM || "Globistic <no-reply@globistic.com>"
  }
};

export const isS3Configured = () =>
  !!(env.aws.accessKeyId && env.aws.secretAccessKey && env.aws.bucket);

export const isSquareConfigured = () =>
  !!(env.square.accessToken && env.square.locationId);

export const isEmailConfigured = () => !!(env.smtp.host && env.smtp.user);
