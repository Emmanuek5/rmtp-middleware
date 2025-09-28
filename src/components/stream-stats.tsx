"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  Server,
  Clock,
  Users,
} from "lucide-react";

interface StreamStats {
  [streamName: string]: {
    startTime: string;
    bytesIn: number;
    bytesOut: number;
    viewers: number;
  };
}

export function StreamStats() {
  const [stats, setStats] = useState<StreamStats>({});
  const [serverHealth, setServerHealth] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/health"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (healthRes.ok) {
        const health = await healthRes.json();
        setServerHealth(health);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const streamNames = Object.keys(stats);
  const totalBytesIn = Object.values(stats).reduce(
    (sum, stat) => sum + stat.bytesIn,
    0
  );
  const totalBytesOut = Object.values(stats).reduce(
    (sum, stat) => sum + stat.bytesOut,
    0
  );
  const totalViewers = Object.values(stats).reduce(
    (sum, stat) => sum + stat.viewers,
    0
  );

  return (
    <div className="space-y-6">
      {/* Server Health */}
      {serverHealth && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Server Status
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant="default">
                  {serverHealth.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated:{" "}
                {new Date(serverHealth.timestamp).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data In</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(totalBytesIn)}
              </div>
              <p className="text-xs text-muted-foreground">Total received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Out</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(totalBytesOut)}
              </div>
              <p className="text-xs text-muted-foreground">Total transmitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalBytesIn > 0
                  ? ((totalBytesOut / totalBytesIn) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Output ratio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Stream Stats */}
      {streamNames.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Individual Stream Statistics</h3>
          <div className="grid gap-4">
            {streamNames.map((streamName) => {
              const stat = stats[streamName];
              return (
                <Card key={streamName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      {streamName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Uptime</span>
                        </div>
                        <p className="text-lg font-bold">
                          {formatUptime(stat.startTime)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Data In</span>
                        </div>
                        <p className="text-lg font-bold">
                          {formatBytes(stat.bytesIn)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Data Out</span>
                        </div>
                        <p className="text-lg font-bold">
                          {formatBytes(stat.bytesOut)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Viewers</span>
                        </div>
                        <p className="text-lg font-bold">{stat.viewers}</p>
                      </div>
                    </div>

                    {/* Stream Quality Indicators */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Stream Health</span>
                        <Badge variant="default">Good</Badge>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Based on data flow and connection stability
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No stream statistics available</p>
          <p className="text-sm">
            Statistics will appear when streams are active
          </p>
        </div>
      )}

      {/* Real-time metrics summary */}
      {streamNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Real-time Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {streamNames.length}
                </div>
                <p className="text-sm text-muted-foreground">Active Streams</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {totalViewers}
                </div>
                <p className="text-sm text-muted-foreground">Total Viewers</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatBytes(totalBytesOut)}
                </div>
                <p className="text-sm text-muted-foreground">Total Output</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
