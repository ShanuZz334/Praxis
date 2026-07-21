import { classifyTask } from '../taskClassifier.js';

export function validateInput(request) {
    if (!request.taskType) {
        throw new Error("taskType is required.");
    }
    
    const tier = classifyTask(request.taskType);
    
    const promptLen = request.prompt ? request.prompt.length : 0;
    if (tier <= 2 && promptLen > 8000 * 4) { 
        throw new Error(`Input too large for Tier ${tier} task.`);
    }

    const needsGrounding = request.taskType !== 'chat_conversation' && request.taskType !== 'chart_qa';
    if (needsGrounding && (!request.data || Object.keys(request.data).length === 0)) {
        throw new Error(`Task type '${request.taskType}' requires grounding data (request.data) to prevent hallucination.`);
    }

    return true;
}
