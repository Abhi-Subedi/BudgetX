"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Badge } from "../components/ui/Controls";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Input";
import { Modal, ConfirmDialog } from "../components/ui/Modal";
import { Icon } from "../components/icons";
import { useToast } from "../hooks/useToast";
import * as api from "../lib/api";

import { ApiError } from "../lib/api";

interface SecurityInfo {
  has_password: boolean;
  password_changed_at: string | null;
  two_factor_enabled: boolean;
  backup_codes_count: number;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  last_active: string;
  current: boolean;
}

export default function SecurityPage() {
  const { toast } = useToast();

  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Password change
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // 2FA
  const [twoFaModalOpen, setTwoFaModalOpen] = useState(false);
  const [twoFaUri, setTwoFaUri] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaBusy, setTwoFaBusy] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  // Disable 2FA
  const [disable2faModalOpen, setDisable2faModalOpen] = useState(false);
  const [disable2faPassword, setDisable2faPassword] = useState("");
  const [disable2faBusy, setDisable2faBusy] = useState(false);

  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [regenBusy, setRegenBusy] = useState(false);

  // Logout all
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);

  // Revoke
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sec, sess] = await Promise.all([
        api.get<SecurityInfo>("/security"),
        api.get<{ sessions: Session[] }>("/security/sessions").catch(() => ({ sessions: [] as Session[] }))
      ]);
      setSecurity(sec);
      setSessions(sess.sessions ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const daysSincePasswordChange = security?.password_changed_at
    ? Math.floor((Date.now() - new Date(security.password_changed_at).getTime()) / 86400000)
    : null;

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await api.post("/security/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast("Password changed successfully");
      setPwModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      loadData();
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  };

  const enable2fa = async () => {
    setTwoFaBusy(true);
    setTwoFaError(null);
    try {
      const res = await api.post<{ uri: string }>("/2fa/setup");
      setTwoFaUri(res.uri);
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : "Could not set up 2FA.");
    } finally {
      setTwoFaBusy(false);
    }
  };

  const verify2fa = async () => {
    setTwoFaError(null);
    if (twoFaCode.length !== 6) {
      setTwoFaError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setTwoFaBusy(true);
    try {
      await api.post("/2fa/verify", { code: twoFaCode });
      toast("Two-factor authentication enabled");
      setTwoFaModalOpen(false);
      setTwoFaUri("");
      setTwoFaCode("");
      loadData();
    } catch (err) {
      setTwoFaError(err instanceof ApiError ? err.message : "Invalid code.");
    } finally {
      setTwoFaBusy(false);
    }
  };

  const disable2fa = async () => {
    setDisable2faBusy(true);
    try {
      await api.post("/2fa/disable", { password: disable2faPassword });
      toast("Two-factor authentication disabled");
      setDisable2faModalOpen(false);
      setDisable2faPassword("");
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not disable 2FA.", "error");
    } finally {
      setDisable2faBusy(false);
    }
  };

  const loadBackupCodes = async () => {
    try {
      const res = await api.get<{ codes: string[] }>("/2fa/backup-codes");
      setBackupCodes(res.codes ?? []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (security?.two_factor_enabled) loadBackupCodes();
  }, [security?.two_factor_enabled]);

  const regenerateBackupCodes = async () => {
    setRegenBusy(true);
    try {
      await api.post("/2fa/backup-codes/regenerate");
      toast("Backup codes regenerated");
      loadBackupCodes();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not regenerate codes.", "error");
    } finally {
      setRegenBusy(false);
    }
  };

  const revokeSession = async (id: string) => {
    setRevokeBusy(true);
    try {
      await api.del(`/security/sessions/${id}`);
      toast("Session revoked");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not revoke session.", "error");
    } finally {
      setRevokeBusy(false);
      setRevokeConfirmId(null);
    }
  };

  const logoutAll = async () => {
    setLogoutAllBusy(true);
    try {
      await api.post("/security/logout-all");
      toast("Logged out of all other devices");
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not log out devices.", "error");
    } finally {
      setLogoutAllBusy(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Security" subtitle="Manage your account security." />
        <div className="flex h-40 items-center justify-center text-sm text-ink3">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Security" subtitle="Manage passwords, two-factor authentication, and sessions." />

      <div className="space-y-12">
        {/* Password */}
        <section aria-label="Password">
          <h2 className="eyebrow mb-4 border-b border-line pb-2">Password</h2>
          <div className="flex items-center justify-between">
            <div>
              {daysSincePasswordChange !== null ? (
                <p className="text-sm text-ink2">
                  Last changed {daysSincePasswordChange === 0 ? "today" : `${daysSincePasswordChange} days ago`}
                </p>
              ) : (
                <p className="text-sm text-ink2">No password set</p>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setPwModalOpen(true)}>
              Change Password
            </Button>
          </div>
        </section>

        {/* Two-Factor Authentication */}
        <section aria-label="Two-Factor Authentication">
          <h2 className="eyebrow mb-4 border-b border-line pb-2">Two-Factor Authentication</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">
                {security?.two_factor_enabled ? "Enabled" : "Disabled"}
              </p>
              <Badge tone={security?.two_factor_enabled ? "pos" : "neutral"}>
                {security?.two_factor_enabled ? "Active" : "Inactive"}
              </Badge>
            </div>
            {security?.two_factor_enabled ? (
              <Button variant="danger" size="sm" onClick={() => setDisable2faModalOpen(true)}>
                Disable 2FA
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled={twoFaBusy}
                onClick={() => {
                  setTwoFaModalOpen(true);
                  enable2fa();
                }}
              >
                {twoFaBusy ? "Setting up…" : "Enable 2FA"}
              </Button>
            )}
          </div>
        </section>

        {/* Backup Codes */}
        {security?.two_factor_enabled && (
          <section aria-label="Backup Codes">
            <h2 className="eyebrow mb-4 border-b border-line pb-2">Backup Codes</h2>
            {backupCodes.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="rounded-md bg-sunken px-3 py-1.5 text-center font-mono text-sm text-ink"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <Button variant="secondary" size="sm" disabled={regenBusy} onClick={regenerateBackupCodes}>
                  {regenBusy ? "Regenerating…" : "Regenerate Codes"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-ink3">No backup codes available.</p>
            )}
          </section>
        )}

        {/* Active Sessions */}
        <section aria-label="Active Sessions">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
            <h2 className="eyebrow">Active Sessions</h2>
            <Button variant="ghost" size="sm" disabled={logoutAllBusy} onClick={logoutAll}>
              {logoutAllBusy ? "Logging out…" : "Log out all other devices"}
            </Button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-ink3">No active sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-line px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon name="credit-card" className="size-5 text-ink3" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{session.device || "Unknown device"}</p>
                        {session.current && <Badge tone="pos">Current</Badge>}
                      </div>
                      <p className="text-xs text-ink3">
                        {session.browser} · {session.os} · Last active{" "}
                        {new Date(session.last_active).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeConfirmId(session.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Change Password Modal */}
      <Modal open={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Change Password">
        <form onSubmit={changePassword} className="px-5 pb-5 pt-4 space-y-4">
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {pwError && (
            <p className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg" role="alert">
              {pwError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPwModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pwBusy}>
              {pwBusy ? "Changing…" : "Change Password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enable 2FA Modal */}
      <Modal open={twoFaModalOpen} onClose={() => { setTwoFaModalOpen(false); setTwoFaUri(""); setTwoFaCode(""); }} title="Enable Two-Factor Authentication">
        <div className="px-5 pb-5 pt-4 space-y-4">
          {twoFaUri ? (
            <>
              <p className="text-sm text-ink2">
                Scan this QR code with your authenticator app, or enter the setup key manually.
              </p>
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFaUri)}`}
                    alt="QR Code"
                    className="h-[200px] w-[200px]"
                  />
                </div>
              </div>
              <div className="rounded-md bg-sunken px-3 py-2">
                <p className="text-xs text-ink3 mb-1">Manual entry key:</p>
                <code className="break-all text-sm text-ink">{twoFaUri}</code>
              </div>
              <Field
                label="Verification code"
                placeholder="Enter 6-digit code"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                maxLength={6}
                inputMode="numeric"
              />
              {twoFaError && (
                <p className="rounded-md bg-negtint px-3.5 py-2.5 text-sm text-neg" role="alert">
                  {twoFaError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => { setTwoFaModalOpen(false); setTwoFaUri(""); setTwoFaCode(""); }}>
                  Cancel
                </Button>
                <Button disabled={twoFaBusy || twoFaCode.length !== 6} onClick={verify2fa}>
                  {twoFaBusy ? "Verifying…" : "Verify & Enable"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-ink3">Setting up…</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal open={disable2faModalOpen} onClose={() => { setDisable2faModalOpen(false); setDisable2faPassword(""); }} title="Disable Two-Factor Authentication">
        <div className="px-5 pb-5 pt-4 space-y-4">
          <p className="text-sm text-ink2">
            Enter your password to disable two-factor authentication. This will make your account less secure.
          </p>
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={disable2faPassword}
            onChange={(e) => setDisable2faPassword(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setDisable2faModalOpen(false); setDisable2faPassword(""); }}>
              Cancel
            </Button>
            <Button variant="danger" disabled={disable2faBusy || !disable2faPassword} onClick={disable2fa}>
              {disable2faBusy ? "Disabling…" : "Disable 2FA"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Session Confirm */}
      <ConfirmDialog
        open={revokeConfirmId !== null}
        onClose={() => setRevokeConfirmId(null)}
        onConfirm={() => revokeConfirmId && revokeSession(revokeConfirmId)}
        title="Revoke Session"
        body="Are you sure you want to revoke this session? The device will be logged out immediately."
        confirmLabel="Revoke"
        busy={revokeBusy}
      />
    </div>
  );
}
