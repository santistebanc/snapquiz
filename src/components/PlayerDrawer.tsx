import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "./ui/button";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Menu } from "lucide-react";
import { generateAvatarUrl } from "../utils";
import type { Player } from "../types";

// Component for animating counter from previous to current value
function AnimatedCounter({ from, to }: { from: number; to: number }) {
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, { 
    stiffness: 100, 
    damping: 30,
    duration: 0.8 
  });
  const display = useTransform(springValue, (current) => Math.round(current));

  useEffect(() => {
    motionValue.set(to);
  }, [to, motionValue]);

  return <motion.span>{display}</motion.span>;
}

interface PlayerDrawerProps {
  players: Player[];
  isPlayerMode?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PlayerDrawer({ players, isPlayerMode = false, open: externalOpen, onOpenChange }: PlayerDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [previousPoints, setPreviousPoints] = useState<Record<string, number>>({});
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  // Track point changes for animation
  useEffect(() => {
    const newPreviousPoints: Record<string, number> = {};
    players.forEach(player => {
      const previous = previousPoints[player.id] || 0;
      newPreviousPoints[player.id] = player.points > previous ? previous : player.points;
    });
    setPreviousPoints(newPreviousPoints);
  }, [players, previousPoints]);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className={`fixed top-4 left-4 z-50 transition-transform duration-200 ${
          open ? "translate-x-80" : "translate-x-0"
        }`}
        onClick={() => setOpen(!open)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Slide-out Card */}
      <Card
        className={`fixed top-0 left-0 w-80 z-40 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } shadow-xl border-r bg-white/90 backdrop-blur-sm`}
      >
        <div className="p-4 space-y-3">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-white/80 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={generateAvatarUrl(player.avatar)}
                      alt={player.name}
                    />
                  </Avatar>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" title={player.name}>
                    {player.name}
                  </p>
                </div>
              </div>
              <motion.div
                key={player.points}
                initial={{ scale: 1.2, color: "#10b981" }}
                animate={{ scale: 1, color: "#6b7280" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex-shrink-0 ml-2"
              >
                <Badge variant="secondary" className="text-sm font-bold">
                  <AnimatedCounter 
                    from={previousPoints[player.id] || 0} 
                    to={player.points} 
                  />
                </Badge>
              </motion.div>
            </div>
          ))}
          {players.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No players yet
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
