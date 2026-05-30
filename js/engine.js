// ===== 模拟推演引擎 =====

class SimulationEngine {
  constructor(scenarioData) {
    this.data = scenarioData;
    this.currentLevel = 0;
    this.totalLevels = scenarioData.levels.length;
    this.score = 0;
    this.answers = [];
    this.wrongAttempts = {}; // { levelIndex: count }
    this.activeConsequence = null;
    this.consequencesTriggered = [];
  }

  getCurrentLevel() {
    if (this.activeConsequence) return this.activeConsequence;
    return this.data.levels[this.currentLevel];
  }

  isInConsequence() {
    return this.activeConsequence !== null;
  }

  getProgress() {
    if (this.activeConsequence) {
      return { current: this.currentLevel + 1, total: this.totalLevels, inConsequence: true };
    }
    return { current: this.currentLevel + 1, total: this.totalLevels, inConsequence: false };
  }

  submitAnswer(answer) {
    const level = this.getCurrentLevel();

    // 排序关卡
    if (level.type === 'sort') {
      const correctOrder = level.sortItems.map(s => s.id);
      const correct = answer.length === correctOrder.length && answer.every((id, i) => id === correctOrder[i]);
      if (correct) {
        this.score++;
        this.answers.push({
          level: this.currentLevel,
          choiceIndex: -1,
          type: 'sort',
          correct: true
        });
        return { correct: true, feedback: level.feedback.correct, consequenceTriggered: false };
      } else {
        this.wrongAttempts[this.currentLevel] = (this.wrongAttempts[this.currentLevel] || 0) + 1;
        return { correct: false, feedback: level.feedback.wrong, consequenceTriggered: false };
      }
    }

    const choiceIndex = answer;
    const correct = choiceIndex === level.correctIndex;

    if (this.activeConsequence) {
      if (correct) {
        this.answers.push({
          level: this.currentLevel,
          choiceIndex: choiceIndex,
          correct: true,
          wasConsequence: true
        });
      } else {
        this.wrongAttempts[this.currentLevel] = (this.wrongAttempts[this.currentLevel] || 0) + 1;
      }
      return {
        correct,
        feedback: correct ? level.feedback.correct : (level.feedback.wrong[choiceIndex] || '再想想哦～'),
        consequenceTriggered: false
      };
    }

    // 主关卡
    if (correct) {
      this.score++;
      this.answers.push({
        level: this.currentLevel,
        choiceIndex: choiceIndex,
        correct: true
      });
    } else {
      this.wrongAttempts[this.currentLevel] = (this.wrongAttempts[this.currentLevel] || 0) + 1;
      // 检查是否触发后果分支
      if (level.consequences && level.consequences[choiceIndex]) {
        this.consequencesTriggered.push({
          choiceIndex: choiceIndex,
          choiceText: level.options[choiceIndex].text,
          consequence: level.consequences[choiceIndex]
        });
        this.activeConsequence = level.consequences[choiceIndex];
        return {
          correct: false,
          feedback: level.feedback.wrong[choiceIndex] || '再想想哦～',
          consequenceTriggered: true
        };
      }
    }

    return {
      correct,
      feedback: correct ? level.feedback.correct : (level.feedback.wrong[choiceIndex] || '再想想哦～'),
      consequenceTriggered: false
    };
  }

  nextLevel() {
    if (this.activeConsequence) {
      this.activeConsequence = null;
      return this.currentLevel < this.totalLevels;
    }
    this.currentLevel++;
    return this.currentLevel < this.totalLevels;
  }

  isComplete() {
    const mainAnswers = this.answers.filter(a => !a.wasConsequence);
    return mainAnswers.length >= this.totalLevels;
  }

  getResult() {
    return {
      score: this.score,
      total: this.totalLevels,
      badge: this.data.badge,
      summary: this.data.summary,
      answers: this.answers,
      wrongAttempts: this.wrongAttempts,
      consequencesTriggered: this.consequencesTriggered
    };
  }
}
