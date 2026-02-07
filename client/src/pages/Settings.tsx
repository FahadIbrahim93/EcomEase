import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Link2,
  Unlink2,
  Facebook,
  Instagram,
  Plus,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const socialQuery = trpc.social.getConnections.useQuery();
  const connectMutation = trpc.social.connectAccount.useMutation();
  const disconnectMutation = trpc.social.disconnectAccount.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "facebook" | "instagram" | "tiktok"
  >("facebook");
  const [formData, setFormData] = useState({
    accountId: "",
    accountName: "",
    accessToken: "",
    refreshToken: "",
  });

  const handleConnect = async () => {
    if (
      !formData.accountId ||
      !formData.accountName ||
      !formData.accessToken
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await connectMutation.mutateAsync({
        platform: selectedPlatform,
        accountId: formData.accountId,
        accountName: formData.accountName,
        accessToken: formData.accessToken,
        refreshToken: formData.refreshToken,
      });

      toast.success(`${selectedPlatform} connected!`);
      setFormData({
        accountId: "",
        accountName: "",
        accessToken: "",
        refreshToken: "",
      });
      setIsOpen(false);
      socialQuery.refetch();
    } catch (error) {
      toast.error("Failed to connect account");
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (confirm(`Disconnect from ${platform}?`)) {
      try {
        await disconnectMutation.mutateAsync({
          platform: platform as any,
        });
        toast.success(`${platform} disconnected!`);
        socialQuery.refetch();
      } catch (error) {
        toast.error("Failed to disconnect account");
      }
    }
  };

  const connections = socialQuery.data || [];
  const connectedPlatforms = connections
    .filter((c) => c.isConnected)
    .map((c) => c.platform);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "tiktok":
        return "🎵";
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and connections
          </p>
        </div>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={user?.name || ""} disabled className="mt-2" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="mt-2" />
              </div>
            </div>
            <div>
              <Label>Account Type</Label>
              <div className="mt-2">
                <Badge>{user?.role === "admin" ? "Admin" : "Seller"}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your profile information is managed through your Manus account.
            </p>
          </CardContent>
        </Card>

        {/* Social Connections */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Social Connections
              </CardTitle>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Connect Social Account</DialogTitle>
                    <DialogDescription>
                      Connect your social media account to start posting and
                      receiving orders
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Platform Selection */}
                    <div>
                      <Label>Platform</Label>
                      <div className="mt-2 space-y-2">
                        {["facebook", "instagram", "tiktok"].map(
                          (platform) => (
                            <button
                              key={platform}
                              onClick={() =>
                                setSelectedPlatform(
                                  platform as
                                    | "facebook"
                                    | "instagram"
                                    | "tiktok"
                                )
                              }
                              className={`w-full p-3 rounded-lg border-2 transition-colors capitalize flex items-center gap-2 ${
                                selectedPlatform === platform
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {getPlatformIcon(platform)}
                              {platform}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Account Details */}
                    <div>
                      <Label>Account ID</Label>
                      <Input
                        placeholder="Your account ID"
                        value={formData.accountId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountId: e.target.value,
                          })
                        }
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Account Name</Label>
                      <Input
                        placeholder="Your account name"
                        value={formData.accountName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountName: e.target.value,
                          })
                        }
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Access Token</Label>
                      <Input
                        placeholder="Your access token"
                        type="password"
                        value={formData.accessToken}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accessToken: e.target.value,
                          })
                        }
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Refresh Token (Optional)</Label>
                      <Input
                        placeholder="Your refresh token"
                        type="password"
                        value={formData.refreshToken}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            refreshToken: e.target.value,
                          })
                        }
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConnect}
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {socialQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-8">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No social accounts connected
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your first account to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(connection.platform)}
                      <div>
                        <p className="font-medium capitalize">
                          {connection.platform}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {connection.accountName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connection.isConnected ? (
                        <Badge variant="default">Connected</Badge>
                      ) : (
                        <Badge variant="secondary">Disconnected</Badge>
                      )}
                      {connection.isConnected && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDisconnect(connection.platform)
                          }
                          disabled={disconnectMutation.isPending}
                        >
                          <Unlink2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              For help connecting your social accounts or managing your ShopEase
              account, please contact our support team.
            </p>
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
