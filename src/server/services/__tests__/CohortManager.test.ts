import { describe, it, expect, beforeEach } from '@jest/globals';
import { CohortManager } from '../CohortManager';
import { AudienceMember } from '@/types/game';

describe('CohortManager', () => {
  let cohortManager: CohortManager;

  beforeEach(() => {
    cohortManager = new CohortManager();
  });

  describe('assignToCohort', () => {
    it('should assign a member to the smallest cohort', () => {
      const member: AudienceMember = {
        id: 'test-id',
        cohort: '',
        score: 0,
      };

      cohortManager.assignToCohort(member);
      expect(member.cohort).toBeTruthy();
    });

    it('should throw error when no cohorts available', () => {
      const member: AudienceMember = {
        id: 'test-id',
        cohort: '',
        score: 0,
      };

      // @ts-ignore - Accessing private property for testing
      cohortManager.cohorts.clear();
      expect(() => cohortManager.assignToCohort(member)).toThrow('No cohorts available');
    });
  });

  describe('removeFromCohort', () => {
    it('should remove a member from their cohort', () => {
      const member: AudienceMember = {
        id: 'test-id',
        cohort: '',
        score: 0,
      };

      cohortManager.assignToCohort(member);
      const cohortId = member.cohort;
      cohortManager.removeFromCohort(member.id);

      const cohort = cohortManager.getCohort(cohortId);
      expect(cohort?.members).not.toContainEqual(expect.objectContaining({ id: member.id }));
    });
  });

  describe('updateCohortScores', () => {
    it('should update cohort scores with personality bias and multipliers', () => {
      const member1: AudienceMember = {
        id: 'member1',
        cohort: '',
        score: 0,
      };
      const member2: AudienceMember = {
        id: 'member2',
        cohort: '',
        score: 0,
      };

      cohortManager.assignToCohort(member1);
      cohortManager.assignToCohort(member2);

      const selections = {
        member1: 'correct-answer',
        member2: 'wrong-answer',
      };

      cohortManager.updateCohortScores(selections, 'correct-answer');
      const stats = cohortManager.getCohortStats();
      const cohortId = member1.cohort;

      expect(stats[cohortId].score).toBeGreaterThan(0);
      expect(stats[cohortId].streak).toBe(1);
    });

    it('should update streak when cohort maintains correct answers', () => {
      const member: AudienceMember = {
        id: 'member1',
        cohort: '',
        score: 0,
      };

      cohortManager.assignToCohort(member);
      const cohortId = member.cohort;

      // First correct answer
      cohortManager.updateCohortScores({ member1: 'correct-answer' }, 'correct-answer');
      let stats = cohortManager.getCohortStats();
      expect(stats[cohortId].streak).toBe(1);

      // Second correct answer
      cohortManager.updateCohortScores({ member1: 'correct-answer' }, 'correct-answer');
      stats = cohortManager.getCohortStats();
      expect(stats[cohortId].streak).toBe(2);
    });
  });

  describe('getCohorts', () => {
    it('should return all cohorts with personality traits', () => {
      const cohorts = cohortManager.getCohorts();
      expect(cohorts).toHaveLength(8);
      expect(cohorts[0]).toHaveProperty('description');
      expect(cohorts[0]).toHaveProperty('specialAbility');
      expect(cohorts[0]).toHaveProperty('scoreMultiplier');
      expect(cohorts[0]).toHaveProperty('bias');
    });
  });

  describe('getCohortStats', () => {
    it('should return stats with personality and streak information', () => {
      const stats = cohortManager.getCohortStats();
      const cohorts = cohortManager.getCohorts();

      expect(Object.keys(stats)).toHaveLength(cohorts.length);
      expect(stats[cohorts[0].id]).toHaveProperty('personality');
      expect(stats[cohorts[0].id]).toHaveProperty('streak');
    });
  });

  describe('getCohortPersonality', () => {
    it('should return personality traits for a specific cohort', () => {
      const personality = cohortManager.getCohortPersonality('skeptics');
      expect(personality).toBeDefined();
      expect(personality?.name).toBe('Skeptics');
      expect(personality?.description).toBe('Always questioning, rarely trusting');
      expect(personality?.specialAbility).toBe('Can detect obvious fake answers');
    });
  });

  describe('getAllPersonalities', () => {
    it('should return all cohort personalities', () => {
      const personalities = cohortManager.getAllPersonalities();
      expect(personalities.size).toBe(8);
      expect(personalities.get('skeptics')).toBeDefined();
      expect(personalities.get('believers')).toBeDefined();
    });
  });

  describe('resetCohorts', () => {
    it('should reset all cohorts to initial state', () => {
      const member: AudienceMember = {
        id: 'test-id',
        cohort: '',
        score: 0,
      };

      cohortManager.assignToCohort(member);
      cohortManager.updateCohortScores({ 'test-id': 'correct-answer' }, 'correct-answer');
      cohortManager.resetCohorts();

      const cohorts = cohortManager.getCohorts();
      expect(cohorts.every(cohort => cohort.members.length === 0)).toBe(true);
      expect(cohorts.every(cohort => cohort.score === 0)).toBe(true);
      expect(cohorts.every(cohort => cohort.streak === 0)).toBe(true);
      expect(cohorts.every(cohort => cohort.lastCorrect === false)).toBe(true);
    });
  });
}); 