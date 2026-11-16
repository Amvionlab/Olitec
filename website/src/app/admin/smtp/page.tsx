"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Server,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getSmtpSettings,
  saveSmtpSettings,
  sendTestEmail,
  type SmtpConfigData,
} from "@/services/admin-inquiries";

export default function AdminSmtpPage() {
  const [config, setConfig] = useState<SmtpConfigData>({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    username: "arish@amvionlabs.com",
    password: "",
    from_email: "arish@amvionlabs.com",
    from_name: "Olitec Clean Energy",
    admin_email: "arish@amvionlabs.com",
    is_enabled: true,
  });

  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string>();
  const [saveError, setSaveError] = useState<string>();

  // Test email state
  const [testEmail, setTestEmail] = useState<string>("arish@amvionlabs.com");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setSaveError(undefined);
    try {
      const data = await getSmtpSettings();
      setConfig(data);
      if (data.admin_email) {
        setTestEmail(data.admin_email);
      }
    } catch (err: any) {
      setSaveError(err?.message || "Failed to load SMTP settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(undefined);
    setSaveError(undefined);

    try {
      const payload: Partial<SmtpConfigData> = {
        host: config.host.trim(),
        port: Number(config.port),
        secure: Boolean(config.secure),
        username: config.username.trim(),
        from_email: config.from_email.trim(),
        from_name: config.from_name.trim(),
        admin_email: config.admin_email.trim(),
        is_enabled: Boolean(config.is_enabled),
      };

      // Only update password if user typed a new one
      if (passwordInput.trim()) {
        payload.password = passwordInput.trim();
      }

      const updated = await saveSmtpSettings(payload);
      setConfig(updated);
      setPasswordInput("");
      setSaveSuccess("SMTP settings updated and saved successfully!");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save SMTP configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestEmail(testEmail.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Failed to connect to SMTP server",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">SMTP &amp; Email Settings</h2>
          <p className="text-xs text-slate-500">
            Configure mail server credentials for sending form submission alerts and notifications to the admin
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Reload
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Form (2 Columns) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Server size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mail Server Configuration</h3>
              <p className="text-xs text-slate-500">Outgoing SMTP connection parameters</p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {/* Host & Port */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="smtp.gmail.com"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="587"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Secure SSL Toggle */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.secure}
                  onChange={(e) => setConfig({ ...config, secure: e.target.checked })}
                  className="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#f99f1e]"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Use SSL/TLS (Enable for port 465, disable for port 587 STARTTLS)
                </span>
              </label>
            </div>

            {/* Username & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SMTP Username / Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="arish@amvionlabs.com"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SMTP Password / App Password{" "}
                  {config.hasPassword && <span className="text-emerald-600 font-normal">(Saved)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={config.hasPassword ? "•••••••• (Leave blank to keep)" : "Enter password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-300 px-3.5 pr-10 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sender Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  From Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="arish@amvionlabs.com"
                  value={config.from_email}
                  onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  From Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Olitec Clean Energy"
                  value={config.from_name}
                  onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Admin Notification Recipient */}
            <div className="pt-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Admin Notification Recipient Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="arish@amvionlabs.com"
                value={config.admin_email}
                onChange={(e) => setConfig({ ...config, admin_email: e.target.value })}
                className="w-full h-10 rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                All incoming service requests, job applications, channel partners, and consultations will be emailed here.
              </p>
            </div>

            {/* Enable Notifications */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.is_enabled}
                  onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
                  className="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#f99f1e]"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Enable automated email notifications on form submissions
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-500 px-6 text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-95 disabled:opacity-60 cursor-pointer shadow-xs"
              >
                <span>{saving ? "Saving…" : "Save Configuration"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Test Email Card & Info (1 Column) */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Send size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Send Test Email</h3>
                <p className="text-[11px] text-slate-500">Verify your credentials work</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Send test email to:</label>
                <input
                  type="email"
                  placeholder="arish@amvionlabs.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={testing}
                onClick={handleSendTest}
                className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition disabled:opacity-60 cursor-pointer"
              >
                <Send size={14} className={testing ? "animate-pulse" : ""} />
                <span>{testing ? "Testing connection…" : "Send Test Email"}</span>
              </button>

              {testResult && (
                <div
                  className={`mt-3 rounded-2xl p-3.5 border text-xs ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.success ? "Success!" : "Connection Failed"}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed break-words">{testResult.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
