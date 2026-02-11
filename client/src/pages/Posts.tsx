import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Upload,
  Calendar,
  Eye,
  Trash2,
  Share2,
  Facebook,
  Instagram,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Posts() {
  const postsQuery = trpc.posts.list.useQuery();
  const createPostMutation = trpc.posts.create.useMutation();
  const publishPostMutation = trpc.posts.publish.useMutation();
  const deletePostMutation = trpc.posts.delete.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    caption: "",
    hashtags: "",
    mediaUrls: [] as string[],
    mediaType: "image" as "image" | "video" | "carousel",
    platforms: [] as string[],
    scheduledAt: "",
  });

  const handleCreatePost = async () => {
    if (!formData.caption || formData.platforms.length === 0) {
      toast.error("Please fill in caption and select platforms");
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        caption: formData.caption,
        hashtags: formData.hashtags,
        mediaUrls: formData.mediaUrls,
        mediaType: formData.mediaType,
        platforms: formData.platforms as any,
        scheduledAt: formData.scheduledAt
          ? new Date(formData.scheduledAt)
          : undefined,
      });

      toast.success("Post created successfully!");
      setFormData({
        caption: "",
        hashtags: "",
        mediaUrls: [],
        mediaType: "image",
        platforms: [],
        scheduledAt: "",
      });
      setIsOpen(false);
      postsQuery.refetch();
    } catch (error) {
      toast.error("Failed to create post");
    }
  };

  const handlePublish = async (postId: number) => {
    try {
      await publishPostMutation.mutateAsync({ id: postId });
      toast.success("Post published!");
      postsQuery.refetch();
    } catch (error) {
      toast.error("Failed to publish post");
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await deletePostMutation.mutateAsync({ id: postId });
      toast.success("Post deleted!");
      postsQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const posts = postsQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Posts</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage posts across all platforms
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Create a post and publish it to multiple platforms
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Caption */}
                <div>
                  <Label>Caption</Label>
                  <Textarea
                    placeholder="Write your post caption..."
                    value={formData.caption}
                    onChange={e =>
                      setFormData({ ...formData, caption: e.target.value })
                    }
                    className="mt-2"
                    rows={4}
                  />
                </div>

                {/* Hashtags */}
                <div>
                  <Label>Hashtags</Label>
                  <Input
                    placeholder="#shopease #fashion #sale"
                    value={formData.hashtags}
                    onChange={e =>
                      setFormData({ ...formData, hashtags: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Media Type */}
                <div>
                  <Label>Media Type</Label>
                  <Select
                    value={formData.mediaType}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        mediaType: value as "image" | "video" | "carousel",
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Media Upload */}
                <div>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Upload Media
                  </Label>
                  <div className="mt-2 p-4 border-2 border-dashed rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to upload
                    </p>
                  </div>
                </div>

                {/* Platforms */}
                <div>
                  <Label>Platforms</Label>
                  <div className="mt-2 space-y-2">
                    {["facebook", "instagram", "tiktok"].map(platform => (
                      <div
                        key={platform}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={platform}
                          checked={formData.platforms.includes(platform)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                platforms: [...formData.platforms, platform],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                platforms: formData.platforms.filter(
                                  p => p !== platform
                                ),
                              });
                            }
                          }}
                        />
                        <Label
                          htmlFor={platform}
                          className="capitalize cursor-pointer"
                        >
                          {platform}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <Label>Schedule (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={e =>
                      setFormData({ ...formData, scheduledAt: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending
                      ? "Creating..."
                      : "Create Post"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {postsQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first post to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        {post.scheduledAt && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(post.scheduledAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{post.caption}</p>
                      <div className="flex gap-2 mt-3">
                        {(() => {
                          try {
                            const platformsStr =
                              typeof post.platforms === "string"
                                ? post.platforms
                                : "[]";
                            const platforms: any[] = JSON.parse(
                              platformsStr
                            ) as any[];
                            return platforms.map(
                              (platform: any, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="capitalize"
                                >
                                  {platform === "facebook" && (
                                    <Facebook className="h-3 w-3 mr-1" />
                                  )}
                                  {platform === "instagram" && (
                                    <Instagram className="h-3 w-3 mr-1" />
                                  )}
                                  {String(platform)}
                                </Badge>
                              )
                            );
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {post.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(post.id)}
                          disabled={publishPostMutation.isPending}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      {post.status === "draft" && (
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletePostMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
