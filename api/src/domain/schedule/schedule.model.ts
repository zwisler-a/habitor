export const scheduleKinds = ['daily', 'weekdays', 'custom'] as const;
export type ScheduleKind = (typeof scheduleKinds)[number];

export const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
export const allDays = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type Weekday = (typeof allDays)[number];

export interface ScheduleConfig {
  kind: ScheduleKind;
  times: string[];
  days?: Weekday[];
}

function parseDay(rawDay: string): Weekday {
  const normalized = rawDay.toLowerCase();

  if ((allDays as readonly string[]).includes(normalized)) {
    return normalized as Weekday;
  }

  throw new Error(`Unsupported schedule day: ${rawDay}`);
}

function validateTime(value: string): string {
  const time = value.trim();

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    throw new Error(`Invalid schedule time: ${value}`);
  }

  return time;
}

export function normalizeSchedule(config: ScheduleConfig): ScheduleConfig {
  const times = config.times.map(validateTime);

  if (times.length === 0) {
    throw new Error('Schedule requires at least one reminder time.');
  }

  const uniqueTimes = new Set(times);
  if (uniqueTimes.size !== times.length) {
    throw new Error('Schedule times must be unique.');
  }

  if (config.kind === 'daily') {
    if (config.days !== undefined && config.days.length > 0) {
      throw new Error('Daily schedules must not include custom days.');
    }

    return {
      kind: 'daily',
      times: [...uniqueTimes].sort(),
    };
  }

  if (config.kind === 'weekdays') {
    if (config.days !== undefined && config.days.length > 0) {
      throw new Error('Weekday schedules must not include custom days.');
    }

    return {
      kind: 'weekdays',
      times: [...uniqueTimes].sort(),
    };
  }

  const rawDays = config.days ?? [];
  if (rawDays.length === 0) {
    throw new Error('Custom schedules require at least one day.');
  }

  const days = rawDays.map((day) => parseDay(day));
  const uniqueDays = new Set(days);
  if (uniqueDays.size !== days.length) {
    throw new Error('Schedule days must be unique.');
  }

  return {
    kind: 'custom',
    times: [...uniqueTimes].sort(),
    days: [...uniqueDays],
  };
}

export function isDayScheduled(config: ScheduleConfig, day: Weekday): boolean {
  const normalized = normalizeSchedule(config);

  if (normalized.kind === 'daily') {
    return true;
  }

  if (normalized.kind === 'weekdays') {
    return (weekdays as readonly string[]).includes(day);
  }

  return (normalized.days ?? []).includes(day);
}
