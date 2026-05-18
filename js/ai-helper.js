// ===== AI助手模块 =====
// 在线模式：连接DeepSeek API实时生成反馈
// 离线模式：使用预生成知识库反馈（比赛演示时使用）

const AI_CONFIG = {
  apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: '',  // 开发时填入自己的API Key
  enabled: false  // 默认离线模式
};

class AIHelper {
  constructor() {
    this.online = false;
  }

  async checkOnline() {
    if (!AI_CONFIG.apiKey || !AI_CONFIG.enabled) {
      this.online = false;
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch(AI_CONFIG.apiEndpoint, {
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.online = true;
      return true;
    } catch (e) {
      this.online = false;
      return false;
    }
  }

  async getOnlineFeedback(scenarioTitle, levelTitle, userChoice, correctAnswer, isCorrect) {
    if (!this.online || !AI_CONFIG.apiKey) return null;

    const prompt = `你是一个面向小学生的安全教育AI助手。请用口语化、友好的语气，给小学生以下反馈：场景是"${scenarioTitle}"，关卡是"${levelTitle}"，学生选择了"${userChoice}"，正确答案是"${correctAnswer}"，学生${isCorrect ? '答对了' : '答错了'}。请用2-3句话给鼓励或纠正，语气像朋友聊天。`;

    try {
      const response = await fetch(AI_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个面向小学生的安全教育AI助手，用口语化、友好的语气对话。每次回复控制在2-3句话。' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.log('AI API调用失败，降级到离线模式');
      return null;
    }
  }

  getOfflineFeedback(feedbackData) {
    return feedbackData;
  }

  async getFeedback(feedbackData, scenarioContext) {
    if (this.online && scenarioContext) {
      try {
        const onlineResult = await this.getOnlineFeedback(
          scenarioContext.title,
          scenarioContext.levelTitle,
          scenarioContext.userChoice,
          scenarioContext.correctAnswer,
          scenarioContext.isCorrect
        );
        if (onlineResult) return onlineResult;
      } catch (e) {
        // 降级
      }
    }
    return this.getOfflineFeedback(feedbackData);
  }
}
