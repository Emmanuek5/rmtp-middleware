"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Users, Clock, MapPin } from "lucide-react";
import Hls from "hls.js";

interface StreamInfo {
  name: string;
  addr: string;
  app: string;
  startTime: string;
  viewers: number;
}

interface StreamViewerProps {
  streams: StreamInfo[];
}

export function StreamViewer({ streams }: StreamViewerProps) {
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (streams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No active streams</p>
        <p className="text-sm">Start streaming to see active streams here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {streams.map((stream) => (
          <Card key={stream.name} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {stream.name}
                  <Badge variant="secondary">LIVE</Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedStream(
                      selectedStream === stream.name ? null : stream.name
                    )
                  }
                >
                  {selectedStream === stream.name ? "Hide" : "Show"} Preview
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{stream.addr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{stream.viewers} viewers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDuration(stream.startTime)}
                  </span>
                </div>
              </div>

              {selectedStream === stream.name && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4">
                    <h4 className="font-medium mb-2">Stream Preview</h4>
                    <div className="aspect-video bg-black rounded flex items-center justify-center text-white">
                      <VideoPlayer streamName={stream.name} />
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Application:</span>
                      <span className="font-mono">{stream.app}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Stream Key:</span>
                      <span className="font-mono">{stream.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Client IP:</span>
                      <span className="font-mono">{stream.addr}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VideoPlayer({ streamName }: { streamName: string }) {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const video = document.getElementById(
      `video-${streamName}`
    ) as HTMLVideoElement | null;
    if (!video) return;
    const src = `/hls/${streamName}.m3u8`;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () => setError("Stream not available yet"));
      return () => hls.destroy();
    } else {
      setError("HLS not supported by this browser");
    }
  }, [streamName]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <video id={`video-${streamName}`} controls className="w-full h-full" />
      {error && (
        <div className="absolute text-xs text-gray-400 px-2 py-1 bg-black/60 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
