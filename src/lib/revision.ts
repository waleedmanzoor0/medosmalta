import { supermemo, type SuperMemoGrade } from "supermemo";
import type { Flashcard } from "./data";

export type ReviewRating = "again" | "hard" | "good" | "easy";
const grades: Record<ReviewRating, SuperMemoGrade> = { again: 1, hard: 3, good: 4, easy: 5 };

export function scheduleReview(card: Pick<Flashcard, "interval_days" | "repetitions" | "ease_factor">, rating: ReviewRating, now = new Date()) {
  const next = supermemo({ interval: card.interval_days, repetition: card.repetitions, efactor: card.ease_factor }, grades[rating]);
  const due = new Date(now);
  due.setDate(due.getDate() + next.interval);
  return { interval_days: next.interval, repetitions: next.repetition, ease_factor: next.efactor, due_at: due.toISOString(), last_reviewed_at: now.toISOString() };
}

export function isDue(dueAt: string, now = new Date()) {
  return new Date(dueAt).getTime() <= now.getTime();
}

export function questionOptions(value: unknown): string[] {
  return Array.isArray(value) && value.length === 4 && value.every((v) => typeof v === "string" && v.trim().length > 0) ? value : [];
}

export function quizScore(answers: { selected: number; correct: number }[]) {
  return { correct_count: answers.filter((a) => a.selected === a.correct).length, total_count: answers.length };
}