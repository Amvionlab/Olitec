"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { register, type RegisterInput } from "@/services/auth";
import {
  hasErrors,
  validateEmail,
  validateMobile,
  validateName,
  validateNewPassword,
  type FieldErrors,
} from "@/lib/validation";

type FormValues = RegisterInput & { confirmPassword: string; acceptTerms: boolean };

const initialValues: FormValues = { name: "", email: "", mobile: "", password: "", confirmPassword: "", acceptTerms: false };

function validate(values: FormValues): FieldErrors<FormValues> {
  return {
    name: validateName(values.name),
    email: validateEmail(values.email),
    mobile: validateMobile(values.mobile),
    password: validateNewPassword(values.password),
    confirmPassword:
      values.confirmPassword === values.password ? undefined : "Passwords do not match.",
    acceptTerms: values.acceptTerms ? undefined : "Please accept the terms to continue.",
  };
}

export function RegisterForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<FormValues>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formError, setFormError] = useState<string>();

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(undefined);
    if (hasErrors(nextErrors)) return;

    setStatus("submitting");
    const result = await register({
      name: values.name.trim(),
      email: values.email.trim(),
      mobile: values.mobile.replace(/\D/g, ""),
      password: values.password,
    });
    if (!result.ok) {
      setStatus("idle");
      setFormError(result.message);
      if (result.fieldErrors) setErrors((e) => ({ ...e, ...result.fieldErrors }));
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="space-y-5">
        <Alert tone="success" title="Account created">
          Welcome, {values.name.trim().split(" ")[0]}! (Demo: the account was not saved.)
        </Alert>
        <ButtonLink href="/login" className="w-full" size="lg">
          Continue to sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}

      <TextField label="Full name" autoComplete="name" value={values.name} onChange={(e) => update("name", e.target.value)} error={errors.name} required />
      <TextField label="Email" type="email" autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} error={errors.email} required />
      <TextField
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        placeholder="10-digit mobile number"
        value={values.mobile}
        onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
        error={errors.mobile}
        required
      />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => update("password", e.target.value)}
        error={errors.password}
        hint="At least 8 characters, including a letter and a number."
        required
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(e) => update("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
        required
      />

      <div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={values.acceptTerms}
            onChange={(e) => update("acceptTerms", e.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-300 accent-brand-600"
          />
          I agree to receive service updates by SMS and email and accept the warranty terms.
        </label>
        {errors.acceptTerms && <p className="mt-1 text-xs text-red-600" role="alert">{errors.acceptTerms}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" loading={status === "submitting"}>
        {status === "submitting" ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
