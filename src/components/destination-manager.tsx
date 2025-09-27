"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm, SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const destinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z
    .string()
    .min(1, "URL is required")
    .refine((url) => {
      try {
        new URL(url);
        return url.startsWith("rtmp://") || url.startsWith("rtmps://");
      } catch {
        return false;
      }
    }, "Must be a valid RTMP URL starting with rtmp:// or rtmps://"),
  key: z.string(),
  enabled: z.boolean(),
});

type DestinationForm = z.infer<typeof destinationSchema>;

interface Destination {
  id: string;
  name: string;
  url: string;
  key: string;
  enabled: boolean;
  createdAt: string;
}

interface DestinationManagerProps {
  destinations: Destination[];
  onUpdate: () => void;
}

export function DestinationManager({
  destinations,
  onUpdate,
}: DestinationManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null);
  const { toast } = useToast();

  const form = useForm<DestinationForm>({
    resolver: zodResolver(destinationSchema) as Resolver<DestinationForm>,
    defaultValues: {
      name: "",
      url: "",
      key: "",
      enabled: true,
    },
  });

  const handleAddDestination = () => {
    setEditingDestination(null);
    form.reset({
      name: "",
      url: "",
      key: "",
      enabled: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditDestination = (destination: Destination) => {
    setEditingDestination(destination);
    form.reset({
      name: destination.name,
      url: destination.url,
      key: destination.key,
      enabled: destination.enabled,
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<DestinationForm> = async (data) => {
    try {
      const url = editingDestination
        ? `/api/destinations/${editingDestination.id}`
        : "/api/destinations";

      const method = editingDestination ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save destination");
      }

      toast({
        title: "Success",
        description: `Destination ${
          editingDestination ? "updated" : "added"
        } successfully`,
      });

      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save destination",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) {
      return;
    }

    try {
      const response = await fetch(`/api/destinations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete destination");
      }

      toast({
        title: "Success",
        description: "Destination deleted successfully",
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete destination",
        variant: "destructive",
      });
    }
  };

  const handleToggleEnabled = async (destination: Destination) => {
    try {
      const response = await fetch(`/api/destinations/${destination.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...destination,
          enabled: !destination.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update destination");
      }

      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update destination",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Configured Destinations</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddDestination}>
              <Plus className="h-4 w-4 mr-2" />
              Add Destination
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDestination
                  ? "Edit Destination"
                  : "Add New Destination"}
              </DialogTitle>
              <DialogDescription>
                Configure where streams should be forwarded to.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="YouTube, Twitch, etc." {...field} />
                      </FormControl>
                      <FormDescription>
                        A friendly name for this destination
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RTMP URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="rtmp://live.twitch.tv/live/"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The RTMP server URL to stream to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream Key (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Your stream key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Stream key if required by the destination
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Enabled</FormLabel>
                        <FormDescription>
                          Whether streams should be forwarded to this
                          destination
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {editingDestination ? "Update" : "Add"} Destination
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {destinations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No destinations configured</p>
          <p className="text-sm">
            Add a destination to start forwarding streams
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinations.map((destination) => (
                <TableRow key={destination.id}>
                  <TableCell className="font-medium">
                    {destination.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {destination.url}
                    {destination.key && "/***"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={destination.enabled ? "default" : "secondary"}
                    >
                      {destination.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Switch
                        checked={destination.enabled}
                        onCheckedChange={() => handleToggleEnabled(destination)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDestination(destination)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(destination.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
