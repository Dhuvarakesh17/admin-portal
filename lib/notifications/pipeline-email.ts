import { Resend } from "resend";

import { ApiClientError } from "@/lib/api/errors";

type PipelineEmailAction = "shortlist" | "rejection" | "interview";

type PipelineEmailInput = {
  to: string;
  candidateName: string;
  role: string;
  action: PipelineEmailAction;
};

const RESEND_ONBOARDING_FROM = "onboarding@resend.dev";

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const replyTo = process.env.PIPELINE_EMAIL_REPLY_TO;

  if (!apiKey) {
    throw new ApiClientError(
      "Pipeline email is not configured. Set RESEND_API_KEY.",
      500,
    );
  }

  return { apiKey, from, replyTo };
}

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new ApiClientError("Missing RESEND_API_KEY", 500);
  }

  return new Resend(apiKey);
}

type ResendSendArgs = Parameters<Resend["emails"]["send"]>[0];

type SendResendEmailArgs = Omit<ResendSendArgs, "from"> & {
  from?: string;
  allowOnboardingFallback?: boolean;
};

function isUnverifiedDomainError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    message?: unknown;
    name?: unknown;
    statusCode?: unknown;
  };

  const message =
    typeof maybeError.message === "string" ? maybeError.message : "";
  const name = typeof maybeError.name === "string" ? maybeError.name : "";
  const statusCode =
    typeof maybeError.statusCode === "number" ? maybeError.statusCode : null;

  return (
    name.toLowerCase() === "validation_error" &&
    (statusCode === 400 ||
      message.toLowerCase().includes("verified domain") ||
      message.toLowerCase().includes("domain is not verified") ||
      message.toLowerCase().includes("sender") ||
      message.toLowerCase().includes("from address"))
  );
}

export async function sendResendEmail(args: SendResendEmailArgs) {
  const resend = getResendClient();
  const { from, allowOnboardingFallback = true, ...emailArgs } = args;
  const configuredFrom = from?.trim() || process.env.RESEND_FROM_EMAIL?.trim();
  const initialFrom = configuredFrom || RESEND_ONBOARDING_FROM;
  const firstAttemptArgs = {
    ...emailArgs,
    from: initialFrom,
  } as ResendSendArgs;

  const firstAttempt = await resend.emails.send(firstAttemptArgs);

  if (
    allowOnboardingFallback &&
    firstAttempt.error &&
    configuredFrom &&
    configuredFrom !== RESEND_ONBOARDING_FROM &&
    isUnverifiedDomainError(firstAttempt.error)
  ) {
    const fallbackArgs = {
      ...emailArgs,
      from: RESEND_ONBOARDING_FROM,
    } as ResendSendArgs;

    return resend.emails.send(fallbackArgs);
  }

  return firstAttempt;
}

function getTemplate(input: PipelineEmailInput) {
  const roleLabel = input.role || "the selected role";

  if (input.action === "shortlist") {
    return {
      subject: `Update on your application for ${roleLabel}`,
      html: `<p>Hi ${input.candidateName || "Candidate"},</p>
<p>Great news. You have been shortlisted for <strong>${roleLabel}</strong>.</p>
<p>Our team will share the next steps shortly.</p>
<p>Regards,<br/>Creinx Hiring Team</p>`,
    };
  }

  if (input.action === "interview") {
    return {
      subject: `Interview invite for ${roleLabel}`,
      html: `<p>Hi ${input.candidateName || "Candidate"},</p>
<p>Thank you for applying for <strong>${roleLabel}</strong>.</p>
<p>We would like to invite you to the interview stage. Our recruiter will contact you with scheduling details.</p>
<p>Regards,<br/>Creinx Hiring Team</p>`,
    };
  }

  return {
    subject: `Update on your application for ${roleLabel}`,
    html: `<p>Hi ${input.candidateName || "Candidate"},</p>
<p>Thank you for your interest in <strong>${roleLabel}</strong> at Creinx.</p>
<p>After careful review, we are moving forward with other profiles for this role.</p>
<p>We appreciate your time and wish you success.</p>
<p>Regards,<br/>Creinx Hiring Team</p>`,
  };
}

export async function sendPipelineEmail(input: PipelineEmailInput) {
  if (!input.to) {
    throw new ApiClientError("Candidate email is missing.", 400);
  }

  const { from, replyTo } = getResendConfig();
  const template = getTemplate(input);

  const result = await sendResendEmail({
    from,
    allowOnboardingFallback: true,
    to: [input.to],
    subject: template.subject,
    html: template.html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (result.error) {
    throw new ApiClientError(
      result.error.message || "Failed to send pipeline email.",
      result.error.statusCode || 500,
      result.error,
    );
  }

  return {
    id: result.data?.id ?? "",
  };
}
