import {
  isDayScheduled,
  normalizeSchedule,
  type ScheduleConfig,
} from './schedule.model';

describe('schedule.model', () => {
  describe('normalizeSchedule', () => {
    it('rejects schedules with no reminder times', () => {
      const config: ScheduleConfig = {
        kind: 'daily',
        times: [],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Schedule requires at least one reminder time.',
      );
    });

    it('normalizes and sorts daily schedules', () => {
      const config: ScheduleConfig = {
        kind: 'daily',
        times: ['18:00', '07:30'],
      };

      expect(normalizeSchedule(config)).toEqual({
        kind: 'daily',
        times: ['07:30', '18:00'],
      });
    });

    it('rejects duplicate reminder times', () => {
      const config: ScheduleConfig = {
        kind: 'daily',
        times: ['08:00', '08:00'],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Schedule times must be unique.',
      );
    });

    it('rejects invalid reminder times', () => {
      const config: ScheduleConfig = {
        kind: 'weekdays',
        times: ['24:00'],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Invalid schedule time: 24:00',
      );
    });

    it('rejects days for non-custom schedules', () => {
      const config: ScheduleConfig = {
        kind: 'weekdays',
        times: ['08:00'],
        days: ['mon'],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Weekday schedules must not include custom days.',
      );
    });

    it('rejects days for daily schedules', () => {
      const config: ScheduleConfig = {
        kind: 'daily',
        times: ['08:00'],
        days: ['mon'],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Daily schedules must not include custom days.',
      );
    });

    it('normalizes custom schedules', () => {
      const config: ScheduleConfig = {
        kind: 'custom',
        times: ['17:30', '08:00'],
        days: ['sun', 'tue'],
      };

      expect(normalizeSchedule(config)).toEqual({
        kind: 'custom',
        times: ['08:00', '17:30'],
        days: ['sun', 'tue'],
      });
    });

    it('rejects custom schedules without days', () => {
      const config: ScheduleConfig = {
        kind: 'custom',
        times: ['08:00'],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Custom schedules require at least one day.',
      );
    });

    it('rejects unsupported days', () => {
      const config: ScheduleConfig = {
        kind: 'custom',
        times: ['08:00'],
        days: ['fri', 'holiday' as never],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Unsupported schedule day: holiday',
      );
    });

    it('rejects duplicate custom days', () => {
      const config: ScheduleConfig = {
        kind: 'custom',
        times: ['08:00'],
        days: ['fri', 'fri'],
      };

      expect(() => normalizeSchedule(config)).toThrow(
        'Schedule days must be unique.',
      );
    });
  });

  describe('isDayScheduled', () => {
    it('returns true for all days in a daily schedule', () => {
      const config: ScheduleConfig = {
        kind: 'daily',
        times: ['08:00'],
      };

      expect(isDayScheduled(config, 'mon')).toBe(true);
      expect(isDayScheduled(config, 'sun')).toBe(true);
    });

    it('returns true only for weekdays in a weekdays schedule', () => {
      const config: ScheduleConfig = {
        kind: 'weekdays',
        times: ['08:00'],
      };

      expect(isDayScheduled(config, 'wed')).toBe(true);
      expect(isDayScheduled(config, 'sat')).toBe(false);
    });

    it('matches custom day lists', () => {
      const config: ScheduleConfig = {
        kind: 'custom',
        times: ['08:00'],
        days: ['sat', 'sun'],
      };

      expect(isDayScheduled(config, 'sun')).toBe(true);
      expect(isDayScheduled(config, 'mon')).toBe(false);
    });
  });
});
