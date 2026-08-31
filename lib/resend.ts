import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;
if (!apiKey) throw new Error("RESEND_API_KEY must be configured");
if (!fromEmail) throw new Error("FROM_EMAIL must be configured");

export const resend = new Resend(apiKey);
export const FROM_EMAIL = fromEmail;
