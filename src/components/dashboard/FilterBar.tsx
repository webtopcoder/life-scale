import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  categories?: string[];
  difficulties?: number[];
  showCompletion?: boolean;
  formats?: string[];
  filters: { category: string; difficulty: string; status: string; format: string };
  onFilterChange: (key: string, value: string) => void;
}

const categoryLabels: Record<string, string> = {
  logic: "Logic", pattern: "Pattern", spatial: "Spatial", speed: "Speed", memory: "Memory", verbal: "Verbal",
  self: "Self-Awareness", cognitive: "Memory & Focus", vascular: "Heart", sleep: "Sleep", movement: "Movement",
  sensory: "Hearing & Vision", mood: "Stress & Connection", reserve: "Learning", creativity: "Creativity",
  collaboration: "Collaboration", archetype: "Archetype",
};

const formatLabels: Record<string, string> = {
  riddle: "Riddles", lateral_thinking: "Lateral Thinking", word_puzzle: "Word Puzzles", logic_trap: "Logic Traps", visual_illusion: "Visual Illusions",
  remote_associates: "Remote Associates", analogy_chain: "Analogy Chain", alternate_uses: "Alternate Uses", what_if: "What If", constraint_flip: "Constraint Flip",
  reaction_time: "Reaction Time", stroop: "Stroop", digit_span: "Digit Span", n_back: "N-Back", trail_making: "Trail Making", go_no_go: "Go / No-Go", symbol_search: "Symbol Search",
  matrix_pattern: "Matrix Pattern", sequence_completion: "Sequence", odd_one_out: "Odd One Out", spatial_rotation: "Spatial Rotation", path_trace: "Path Trace",
  classic: "🧩 Classic", key_lock: "🔑 Key & Lock", portal: "🌀 Portal", star_hunt: "⭐ Star Hunt", gauntlet: "⚔️ Gauntlet",
};

export default function FilterBar({ categories, difficulties, showCompletion = true, formats, filters, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {formats && formats.length > 0 && (
        <Select value={filters.format} onValueChange={(v) => onFilterChange("format", v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Format" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            {formats.map(f => <SelectItem key={f} value={f}>{formatLabels[f] || f}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {categories && categories.length > 0 && (
        <Select value={filters.category} onValueChange={(v) => onFilterChange("category", v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{categoryLabels[c] || c}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {difficulties && difficulties.length > 0 && (
        <Select value={filters.difficulty} onValueChange={(v) => onFilterChange("difficulty", v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {difficulties.map(d => <SelectItem key={d} value={String(d)}>Level {d}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {showCompletion && (
        <Select value={filters.status} onValueChange={(v) => onFilterChange("status", v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
