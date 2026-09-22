-- Align content format enums with values used in the product / Supabase backup.
ALTER TABLE "brain_teasers" ALTER COLUMN "format" TYPE TEXT USING ("format"::text);
ALTER TABLE "puzzles" ALTER COLUMN "format" TYPE TEXT USING ("format"::text);

DROP TYPE "BrainTeaserFormat";
DROP TYPE "PuzzleFormat";

CREATE TYPE "BrainTeaserFormat" AS ENUM ('riddle', 'lateral_thinking', 'word_puzzle', 'logic_trap', 'visual_illusion');
CREATE TYPE "PuzzleFormat" AS ENUM ('odd_one_out', 'spatial_rotation', 'path_trace', 'matrix_pattern', 'sequence_completion');

ALTER TABLE "brain_teasers" ALTER COLUMN "format" TYPE "BrainTeaserFormat" USING ("format"::"BrainTeaserFormat");
ALTER TABLE "puzzles" ALTER COLUMN "format" TYPE "PuzzleFormat" USING ("format"::"PuzzleFormat");
