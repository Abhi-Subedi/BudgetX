"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Avatar } from "../components/ui/Controls";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import * as api from "../lib/api";
import { ApiError } from "../lib/api";

interface Profile {
  first_name: string;
  last_name: string;
  display_name: string;
  bio: string;
  date_of_birth: string;
  avatar_url: string | null;
}

export default function ProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile>({
    first_name: "",
    last_name: "",
    display_name: "",
    bio: "",
    date_of_birth: "",
    avatar_url: null
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Profile>("/profile");
        setProfile({
          first_name: res.first_name ?? "",
          last_name: res.last_name ?? "",
          display_name: res.display_name ?? "",
          bio: res.bio ?? "",
          date_of_birth: res.date_of_birth ?? "",
          avatar_url: res.avatar_url ?? null
        });
      } catch {
        // fall back to user object
        if (user) {
          const nameParts = (user.name ?? "").split(" ");
          setProfile({
            first_name: nameParts[0] ?? "",
            last_name: nameParts.slice(1).join(" "),
            display_name: user.name ?? "",
            bio: "",
            date_of_birth: "",
            avatar_url: null
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const update = (key: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch("/profile", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        bio: profile.bio,
        date_of_birth: profile.date_of_birth || null
      });
      await refreshUser();
      toast("Profile updated");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update profile.", "error");
    } finally {
      setBusy(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setAvatarBusy(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post<{ avatar_url: string }>("/profile/avatar", formData as any);
      setProfile((prev) => ({ ...prev, avatar_url: res.avatar_url }));
      await refreshUser();
      toast("Avatar uploaded");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not upload avatar.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try {
      await api.del("/profile/avatar");
      setProfile((prev) => ({ ...prev, avatar_url: null }));
      await refreshUser();
      toast("Avatar removed");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not remove avatar.", "error");
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Profile" subtitle="Update your personal information." />
        <div className="flex h-40 items-center justify-center text-sm text-ink3">Loading…</div>
      </div>
    );
  }

  const displayName = profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() || user?.name || "User";

  return (
    <div>
      <PageHeader title="Edit Profile" subtitle="Update your personal information." />

      <form onSubmit={save} className="max-w-lg space-y-6">
        {/* Avatar Section */}
        <div className="rounded-lg border border-line px-5 py-4">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <Avatar name={displayName} className="size-16 text-lg" />
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarBusy ? "Uploading…" : "Upload"}
              </Button>
              {profile.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={avatarBusy}
                  onClick={removeAvatar}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="First name"
            value={profile.first_name}
            onChange={(e) => update("first_name", e.target.value)}
          />
          <Field
            label="Last name"
            value={profile.last_name}
            onChange={(e) => update("last_name", e.target.value)}
          />
        </div>

        <Field
          label="Display name"
          value={profile.display_name}
          onChange={(e) => update("display_name", e.target.value)}
          placeholder={displayName}
        />

        <Field
          label="Bio"
          value={profile.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="A little about yourself"
        />

        <Field
          label="Date of birth"
          type="date"
          value={profile.date_of_birth}
          onChange={(e) => update("date_of_birth", e.target.value)}
        />

        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
