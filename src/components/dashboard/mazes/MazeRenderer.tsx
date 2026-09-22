import { useState, useEffect, useCallback, useMemo } from "react";
import { useSwipe } from "@/hooks/useSwipe";
import type { MazeData, CellType } from "./maze-types";
import { themeConfig } from "./maze-types";
import { solveMaze } from "./maze-solver";
import { Key, DoorOpen, Zap, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Pos = [number, number];
type Direction = "up" | "down" | "left" | "right";

const dirMap: Record<Direction, Pos> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

interface MazeRendererProps {
  maze: MazeData;
  onBack: () => void;
  onComplete: (stars: number, time: number, moves: number) => void;
}

function findCell(grid: CellType[][], type: CellType): Pos {
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[r].length; c++)
      if (grid[r][c] === type) return [r, c];
  return [0, 0];
}

const MazeRenderer = ({ maze, onBack, onComplete }: MazeRendererProps) => {
  const startPos = useMemo(() => findCell(maze.gridData, 2), [maze]);
  const minMoves = useMemo(() => solveMaze(maze).minMoves, [maze]);
  const [pos, setPos] = useState<Pos>(startPos);
  const [hasKey, setHasKey] = useState(false);
  const [collectedStars, setCollectedStars] = useState<Set<string>>(new Set());
  const [doorOpen, setDoorOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [trail, setTrail] = useState<Set<string>>(new Set([`${startPos[0]},${startPos[1]}`]));

  // Timer
  useEffect(() => {
    if (completed) return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [completed, startTime]);

  // Moving walls toggle
  const [wallPhase, setWallPhase] = useState(false);
  const hasMovingWalls = maze.specialElements.some((e) => e.type === "moving_wall");

  useEffect(() => {
    if (!hasMovingWalls) return;
    const id = setInterval(() => setWallPhase((p) => !p), 2000);
    return () => clearInterval(id);
  }, [hasMovingWalls]);

  // Build effective grid with moving walls
  const effectiveGrid = useMemo(() => {
    const g = maze.gridData.map((row) => [...row]);
    maze.specialElements
      .filter((e) => e.type === "moving_wall")
      .forEach((e) => {
        // In phase A: positions are walls, linkedTo are paths
        // In phase B: positions are paths, linkedTo are walls
        e.positions.forEach(([r, c]) => {
          g[r][c] = wallPhase ? 1 : 0;
        });
        e.linkedTo?.forEach(([r, c]) => {
          g[r][c] = wallPhase ? 0 : 1;
        });
      });
    return g;
  }, [maze, wallPhase]);

  const teleporters = useMemo(() => {
    const map = new Map<string, Pos>();
    maze.specialElements
      .filter((e) => e.type === "teleporter")
      .forEach((e) => {
        if (e.linkedTo && e.positions.length && e.linkedTo.length) {
          map.set(`${e.positions[0][0]},${e.positions[0][1]}`, e.linkedTo[0]);
          map.set(`${e.linkedTo[0][0]},${e.linkedTo[0][1]}`, e.positions[0]);
        }
      });
    return map;
  }, [maze]);

  const move = useCallback(
    (dir: Direction) => {
      if (completed) return;
      const [dr, dc] = dirMap[dir];
      const nr = pos[0] + dr;
      const nc = pos[1] + dc;

      if (nr < 0 || nr >= effectiveGrid.length || nc < 0 || nc >= effectiveGrid[0].length) return;

      const cell = effectiveGrid[nr][nc];
      const origCell = maze.gridData[nr][nc];

      // Can't walk into walls
      if (cell === 0) return;

      // Door check
      if (origCell === 5 && !hasKey && !doorOpen) {
        toast.error("You need a key to open this door!");
        return;
      }

      const newPos: Pos = [nr, nc];
      setPos(newPos);
      setMoves((m) => m + 1);
      setTrail((t) => new Set(t).add(`${nr},${nc}`));

      // Key pickup
      if (origCell === 4 && !hasKey) {
        setHasKey(true);
        toast.success("Key collected! 🔑");
      }

      // Door unlock
      if (origCell === 5 && hasKey && !doorOpen) {
        setDoorOpen(true);
        toast.success("Door unlocked! 🚪");
      }

      // Star collect
      if (origCell === 7) {
        const key = `${nr},${nc}`;
        if (!collectedStars.has(key)) {
          setCollectedStars((s) => new Set(s).add(key));
          toast.success("Star collected! ⭐");
        }
      }

      // Teleporter
      const teleKey = `${nr},${nc}`;
      if (teleporters.has(teleKey)) {
        const dest = teleporters.get(teleKey)!;
        setTimeout(() => {
          setPos(dest);
          setTrail((t) => new Set(t).add(`${dest[0]},${dest[1]}`));
          toast("Teleported! ✨", { duration: 1500 });
        }, 200);
      }

      // Exit
      if (origCell === 3) {
        setCompleted(true);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        onComplete(collectedStars.size, elapsed, moves + 1);
      }
    },
    [pos, effectiveGrid, maze, hasKey, doorOpen, collectedStars, teleporters, completed, startTime, onComplete]
  );

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  // Swipe controls
  const swipeHandlers = useSwipe(move);

  // Tap-to-move: determine direction based on tap relative to player
  const handleCellClick = (r: number, c: number) => {
    const dr = r - pos[0];
    const dc = c - pos[1];
    // Only allow adjacent cells
    if (Math.abs(dr) + Math.abs(dc) !== 1) return;
    if (dr === -1) move("up");
    else if (dr === 1) move("down");
    else if (dc === -1) move("left");
    else if (dc === 1) move("right");
  };

  const rows = effectiveGrid.length;
  const cols = effectiveGrid[0].length;
  // Calculate cell size to fit screen (max ~340px width on mobile)
  const cellSize = Math.min(Math.floor(340 / cols), Math.floor(400 / rows), 40);
  const gap = 1;

  const config = themeConfig[maze.theme];


  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      {...swipeHandlers}
    >
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2
          className="text-sm font-bold text-foreground"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {maze.title}
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
          <span>·</span>
          <span>{moves} moves</span>
        </div>
      </header>

      {/* Status bar */}
      <div className="px-4 py-2 flex items-center gap-3 text-xs border-b border-border">
        {maze.specialElements.some((e) => e.type === "key") && (
          <span className={`flex items-center gap-1 ${hasKey ? "text-accent" : "text-muted-foreground"}`}>
            <Key className="h-3.5 w-3.5" />
            {hasKey ? "Collected" : "Find key"}
          </span>
        )}
        {maze.specialElements.some((e) => e.type === "door") && (
          <span className={`flex items-center gap-1 ${doorOpen ? "text-success" : "text-muted-foreground"}`}>
            <DoorOpen className="h-3.5 w-3.5" />
            {doorOpen ? "Open" : "Locked"}
          </span>
        )}
        {maze.specialElements.some((e) => e.type === "star") && (
          <span className="flex items-center gap-1 text-accent">
            <Star className="h-3.5 w-3.5" />
            {collectedStars.size} / {maze.specialElements.filter((e) => e.type === "star").reduce((n, e) => n + e.positions.length, 0)}
          </span>
        )}
        {hasMovingWalls && (
          <span className="flex items-center gap-1 text-destructive">
            <Zap className="h-3.5 w-3.5" />
            Moving walls
          </span>
        )}
      </div>

      {/* Maze grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="relative select-none"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            gap: `${gap}px`,
          }}
        >
          {effectiveGrid.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = pos[0] === r && pos[1] === c;
              const isStart = maze.gridData[r][c] === 2;
              const isExit = maze.gridData[r][c] === 3;
              const isKey = maze.gridData[r][c] === 4 && !hasKey;
              const isDoor = maze.gridData[r][c] === 5 && !doorOpen;
              const isTeleporter = maze.gridData[r][c] === 6;
              const isStar = maze.gridData[r][c] === 7 && !collectedStars.has(`${r},${c}`);
              const isMovingWall = maze.gridData[r][c] === 8;
              const isWall = cell === 0;
              const isTrail = trail.has(`${r},${c}`) && !isPlayer;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`
                    rounded-sm transition-all duration-150 cursor-pointer
                    flex items-center justify-center text-[10px] font-bold
                    ${isWall ? "bg-foreground/15" : ""}
                    ${!isWall && !isPlayer ? "bg-muted/60" : ""}
                    ${isTrail && !isWall ? "bg-primary/15" : ""}
                    ${isPlayer ? "bg-primary shadow-md shadow-primary/30 scale-105" : ""}
                    ${isExit && !isPlayer ? "bg-success/30 border border-success/50" : ""}
                    ${isStart && !isPlayer ? "bg-primary/20 border border-primary/30" : ""}
                    ${isMovingWall ? (isWall ? "bg-destructive/30 animate-pulse" : "bg-destructive/10") : ""}
                  `}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {isPlayer && (
                    <div className="w-3/5 h-3/5 rounded-full bg-primary-foreground animate-pulse" />
                  )}
                  {isKey && !isPlayer && <Key className="h-3 w-3 text-accent" />}
                  {isDoor && !isPlayer && <DoorOpen className="h-3 w-3 text-destructive" />}
                  {isTeleporter && !isPlayer && (
                    <div className="w-3/5 h-3/5 rounded-full bg-blue-400/60 animate-pulse" />
                  )}
                  {isStar && !isPlayer && <Star className="h-3 w-3 text-accent fill-accent" />}
                  {isExit && !isPlayer && <span className="text-success">🏁</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* D-pad for mobile */}
      <div className="pb-6 pt-2 flex justify-center">
        <div className="grid grid-cols-3 gap-1 w-32">
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={() => move("up")}
          >
            ▲
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={() => move("left")}
          >
            ◀
          </Button>
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
            {moves}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={() => move("right")}
          >
            ▶
          </Button>
          <div />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg"
            onClick={() => move("down")}
          >
            ▼
          </Button>
          <div />
        </div>
      </div>

      {/* Completion overlay */}
      {completed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-4 text-center max-w-sm shadow-xl">
            <div className="text-4xl mb-3">🎉</div>
            <h3
              className="text-xl font-bold text-foreground mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Maze Complete!
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {moves} moves · {collectedStars.size > 0 ? `${collectedStars.size} stars · ` : ""}
              +{maze.xpReward} XP
            </p>
            {minMoves > 0 && (
              <p className="text-xs text-muted-foreground mb-4">
                Minimum possible: <span className={`font-semibold ${moves <= minMoves ? "text-success" : "text-foreground"}`}>{minMoves} moves</span>
                {moves <= minMoves && " — Perfect! 🏆"}
              </p>
            )}
            <Button onClick={onBack} className="w-full">
              Back to Hub
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MazeRenderer;
