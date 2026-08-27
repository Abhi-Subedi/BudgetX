"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "../components/layout/AppShell";
import { Badge } from "../components/ui/Controls";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/icons";
import { useToast } from "../hooks/useToast";
import * as api from "../lib/api";

interface Provider {
  provider: string;
  connected: boolean;
  email?: string;
  has_password?: boolean;
}

export default function ConnectedAccountsPage() {
  const { toast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ providers: Provider[] }>("/oauth/providers");
        setProviders(res.providers ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getProviderStatus = (name: string): Provider | undefined =>
    providers.find((p) => p.provider === name);

  const passwordProvider = providers.find((p) => p.provider === "password");
  const hasPassword = passwordProvider?.connected ?? false;
  const connectedCount = providers.filter((p) => p.connected).length;

  const providerInfo: Array<{
    id: string;
    label: string;
    icon: string;
    description: string;
  }> = [
    { id: "google", label: "Google", icon: "spark", description: "Sign in with your Google account" },
    { id: "apple", label: "Apple", icon: "heart", description: "Sign in with your Apple ID" }
  ];

  return (
    <div>
      <PageHeader title="Connected Accounts" subtitle="Manage third-party login providers." />

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-ink3">Loading…</div>
      ) : (
        <div className="space-y-4 max-w-lg">
          {/* Password */}
          <div className="rounded-lg border border-line px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="credit-card" className="size-5 text-ink3" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-ink3">Traditional email and password login</p>
                </div>
              </div>
              <Badge tone={hasPassword ? "pos" : "warn"}>
                {hasPassword ? "Configured" : "Not set"}
              </Badge>
            </div>
          </div>

          {/* OAuth Providers */}
          {providerInfo.map((provider) => {
            const status = getProviderStatus(provider.id);
            const isOnlyAuth = !hasPassword && connectedCount === 1 && status?.connected;

            return (
              <div key={provider.id} className="rounded-lg border border-line px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name={provider.icon as any} className="size-5 text-ink3" />
                    <div>
                      <p className="text-sm font-medium">{provider.label}</p>
                      <p className="text-xs text-ink3">{provider.description}</p>
                      {status?.email && (
                        <p className="text-xs text-ink2 mt-0.5">{status.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status?.connected ? (
                      <>
                        <Badge tone="pos">Connected</Badge>
                        {isOnlyAuth ? (
                          <Button variant="ghost" size="sm" disabled title="This is your only sign-in method">
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast("Disconnect functionality coming soon")}
                          >
                            Disconnect
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toast("OAuth connection coming soon")}
                      >
                        Connect {provider.label}
                      </Button>
                    )}
                  </div>
                </div>
                {isOnlyAuth && (
                  <p className="mt-2 text-xs text-warn">
                    This is your only sign-in method. Set a password before disconnecting.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
