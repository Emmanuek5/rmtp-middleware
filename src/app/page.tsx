"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Settings, Users, Activity } from "lucide-react";
import { DestinationManager } from "@/components/destination-manager";
import { StreamViewer } from "@/components/stream-viewer";
import { StreamStats } from "@/components/stream-stats";
import { useToast } from "@/hooks/use-toast";

interface StreamInfo {
  name: string;
  addr: string;
  app: string;
  startTime: string;
  viewers: number;
}

interface Destination {
  id: string;
  name: string;
  url: string;
  key: string;
  enabled: boolean;
  createdAt: string;
}

export default function Home() {
  const [activeStreams, setActiveStreams] = useState<StreamInfo[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [streamsRes, destinationsRes] = await Promise.all([
        fetch("/api/streams"),
        fetch("/api/destinations"),
      ]);

      if (streamsRes.ok) {
        const streams = await streamsRes.json();
        setActiveStreams(streams);
      }

      if (destinationsRes.ok) {
        const dests = await destinationsRes.json();
        setDestinations(dests);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data from server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDestinationUpdate = () => {
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading RTMP Controller...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            RTMP Middleware Controller
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage streaming destinations and monitor active streams
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Streams
              </CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStreams.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeStreams.length === 1 ? "stream" : "streams"} currently
                live
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Destinations
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{destinations.length}</div>
              <p className="text-xs text-muted-foreground">
                {destinations.filter((d) => d.enabled).length} enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Viewers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeStreams.reduce((sum, stream) => sum + stream.viewers, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                across all streams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={activeStreams.length > 0 ? "default" : "secondary"}
                >
                  {activeStreams.length > 0 ? "LIVE" : "IDLE"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Server operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="streams" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="streams">Live Streams</TabsTrigger>
            <TabsTrigger value="destinations">Destinations</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="streams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Streams</CardTitle>
                <CardDescription>
                  Monitor active RTMP streams and viewers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StreamViewer streams={activeStreams} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="destinations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stream Destinations</CardTitle>
                <CardDescription>
                  Configure where streams are forwarded to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DestinationManager
                  destinations={destinations}
                  onUpdate={handleDestinationUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stream Statistics</CardTitle>
                <CardDescription>
                  Detailed analytics and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StreamStats />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* RTMP Connection Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Connection Information</CardTitle>
            <CardDescription>
              Use these settings to connect to the RTMP server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">RTMP URL</label>
                <code className="block p-2 bg-muted rounded text-sm">
                  rtmp://localhost:1935/live
                </code>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stream Key</label>
                <code className="block p-2 bg-muted rounded text-sm">
                  your_stream_key
                </code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure your streaming software (OBS, FFmpeg, etc.) with these
              settings to start streaming.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
