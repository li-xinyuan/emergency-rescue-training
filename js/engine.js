// ===== 模拟推演引擎 =====

class SimulationEngine {
  constructor(scenarioData) {
    this.data = scenarioData;
    this.currentLevel = 0;
    this.totalLevels = scenarioData.levels.length;
    this.score = 0;
    this.answers = [];
  }

  getCurrentLevel() {
    return this.data.levels[this.currentLevel];
  }

  getProgress() {
    return {
      current: this.currentLevel + 1,
      total: this.totalLevels
    };
  }

  submitAnswer(choiceIndex) {
    const level = this.getCurrentLevel();
    const correct = choiceIndex === level.correctIndex;
    if (correct) {
      this.score++;
      this.answers.push({
        level: this.currentLevel,
        choiceIndex: choiceIndex,
        correct: correct
      });
    }

    let feedback;
    if (correct) {
      feedback = level.feedback.correct;
    } else {
      feedback = level.feedback.wrong[choiceIndex] || '再想想哦～';
    }

    return { correct, feedback };
  }

  nextLevel() {
    this.currentLevel++;
    return this.currentLevel < this.totalLevels;
  }

  isComplete() {
    return this.answers.length >= this.totalLevels;
  }

  getResult() {
    return {
      score: this.score,
      total: this.totalLevels,
      badge: this.data.badge,
      summary: this.data.summary,
      answers: this.answers
    };
  }
}
