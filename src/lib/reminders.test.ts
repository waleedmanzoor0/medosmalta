import { describe, expect, it } from "vitest";
import { eventDueForReminder, taskDueForReminder } from "./reminders";

const now = new Date("2026-10-23T09:00:00Z"); // 11:00 Malta

describe("reminders", () => {
  it("alerts for an event starting in 30 minutes", () => {
    expect(eventDueForReminder("2026-10-23T09:30:00Z", now)).toBe(true);
  });
  it("does not alert for an event 31 minutes away", () => {
    expect(eventDueForReminder("2026-10-23T09:31:00Z", now)).toBe(false);
  });
  it("does not alert for an event already started", () => {
    expect(eventDueForReminder("2026-10-23T08:59:00Z", now)).toBe(false);
  });
  it("alerts for an open task due today after 08:00 Malta", () => {
    expect(taskDueForReminder("2026-10-23", false, now)).toBe(true);
  });
  it("does not alert before 08:00 Malta", () => {
    expect(taskDueForReminder("2026-10-23", false, new Date("2026-10-23T05:30:00Z"))).toBe(false);
  });
  it("skips completed tasks", () => {
    expect(taskDueForReminder("2026-10-23", true, now)).toBe(false);
  });
});
