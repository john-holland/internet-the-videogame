import { Cohort, AudienceMember } from '@/types/game';

interface CohortPersonality {
  name: string;
  description: string;
  specialAbility: string;
  scoreMultiplier: number;
  bias: number; // -1 to 1, where -1 is always wrong, 1 is always right
}

export class CohortManager {
  private cohorts: Map<string, Cohort> = new Map();
  private readonly personalities: Map<string, CohortPersonality> = new Map([
    ['skeptics', {
      name: 'Skeptics',
      description: 'Always questioning, rarely trusting',
      specialAbility: 'Can detect obvious fake answers',
      scoreMultiplier: 1.2,
      bias: -0.3
    }],
    ['believers', {
      name: 'Believers',
      description: 'Trusting and optimistic',
      specialAbility: 'Bonus points for believing real content',
      scoreMultiplier: 1.5,
      bias: 0.3
    }],
    ['analysts', {
      name: 'Analysts',
      description: 'Methodical and data-driven',
      specialAbility: 'Can analyze answer patterns',
      scoreMultiplier: 1.0,
      bias: 0.1
    }],
    ['trolls', {
      name: 'Trolls',
      description: 'Chaotic and unpredictable',
      specialAbility: 'Random chance to get bonus points',
      scoreMultiplier: 2.0,
      bias: 0.0
    }],
    ['lurkers', {
      name: 'Lurkers',
      description: 'Observant and patient',
      specialAbility: 'Can see what others are selecting',
      scoreMultiplier: 0.8,
      bias: 0.2
    }],
    ['power-users', {
      name: 'Power Users',
      description: 'Experienced and knowledgeable',
      specialAbility: 'Higher chance of correct answers',
      scoreMultiplier: 1.3,
      bias: 0.4
    }],
    ['newbies', {
      name: 'Newbies',
      description: 'Fresh and unpredictable',
      specialAbility: 'Random bonus points for correct answers',
      scoreMultiplier: 1.5,
      bias: -0.1
    }],
    ['veterans', {
      name: 'Veterans',
      description: 'Seasoned and wise',
      specialAbility: 'Can spot patterns from previous rounds',
      scoreMultiplier: 1.1,
      bias: 0.3
    }]
  ]);

  constructor() {
    this.initializeCohorts();
  }

  private initializeCohorts(): void {
    this.personalities.forEach((personality, id) => {
      this.cohorts.set(id, {
        id,
        name: personality.name,
        members: [],
        score: 0,
        description: personality.description,
        specialAbility: personality.specialAbility,
        scoreMultiplier: personality.scoreMultiplier,
        bias: personality.bias,
        streak: 0,
        lastCorrect: false
      });
    });
  }

  assignToCohort(member: AudienceMember): void {
    if (this.cohorts.size === 0) {
      throw new Error('No cohorts available');
    }

    // Find the cohort with the least members
    let smallestCohort = Array.from(this.cohorts.values())[0];
    for (const cohort of this.cohorts.values()) {
      if (cohort.members.length < smallestCohort.members.length) {
        smallestCohort = cohort;
      }
    }

    member.cohort = smallestCohort.id;
    smallestCohort.members.push(member);
  }

  removeFromCohort(memberId: string): void {
    for (const cohort of this.cohorts.values()) {
      const index = cohort.members.findIndex((m) => m.id === memberId);
      if (index !== -1) {
        cohort.members.splice(index, 1);
        break;
      }
    }
  }

  updateCohortScores(selections: Record<string, string>, correctAnswer: string): void {
    for (const cohort of this.cohorts.values()) {
      let correctSelections = 0;
      const personality = this.personalities.get(cohort.id)!;

      for (const member of cohort.members) {
        if (selections[member.id] === correctAnswer) {
          correctSelections++;
        }
      }

      const accuracy = cohort.members.length > 0 ? correctSelections / cohort.members.length : 0;
      const baseScore = accuracy * 100;
      
      // Apply personality bias
      const biasedScore = baseScore * (1 + personality.bias);
      
      // Apply score multiplier
      const multipliedScore = biasedScore * personality.scoreMultiplier;
      
      // Update streak
      const isCorrect = accuracy > 0.5;
      if (isCorrect === cohort.lastCorrect) {
        cohort.streak++;
      } else {
        cohort.streak = 1;
      }
      cohort.lastCorrect = isCorrect;

      // Apply streak bonus
      const streakBonus = Math.min(cohort.streak * 10, 50);
      cohort.score += multipliedScore + streakBonus;
    }
  }

  getCohorts(): Cohort[] {
    return Array.from(this.cohorts.values());
  }

  getCohort(id: string): Cohort | undefined {
    return this.cohorts.get(id);
  }

  getCohortStats(): Record<string, { 
    size: number; 
    score: number; 
    accuracy: number;
    streak: number;
    personality: CohortPersonality;
  }> {
    const stats: Record<string, { 
      size: number; 
      score: number; 
      accuracy: number;
      streak: number;
      personality: CohortPersonality;
    }> = {};
    
    for (const cohort of this.cohorts.values()) {
      const correctSelections = cohort.members.filter(
        (m) => m.selectedAnswer === cohort.members[0]?.selectedAnswer
      ).length;
      
      stats[cohort.id] = {
        size: cohort.members.length,
        score: cohort.score,
        accuracy: cohort.members.length > 0 ? correctSelections / cohort.members.length : 0,
        streak: cohort.streak,
        personality: this.personalities.get(cohort.id)!
      };
    }

    return stats;
  }

  resetCohorts(): void {
    for (const cohort of this.cohorts.values()) {
      cohort.members = [];
      cohort.score = 0;
      cohort.streak = 0;
      cohort.lastCorrect = false;
    }
  }

  getCohortPersonality(id: string): CohortPersonality | undefined {
    return this.personalities.get(id);
  }

  getAllPersonalities(): Map<string, CohortPersonality> {
    return this.personalities;
  }
} 
} 