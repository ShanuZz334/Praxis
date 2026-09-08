import { classifyTask } from '../taskClassifier.js';

export function validateInput(request) {
    if (!request.taskType) {
        throw new Error("taskType is required.");
    }
    
    const level = classifyTask(request.taskType);
    
    const promptLen = request.prompt ? request.prompt.length : 0;
    
    // Bug 11 Fix: Map levels correctly instead of legacy tier numbers
    if (['level1_fast', 'level2_standard'].includes(level) && promptLen > 8000 * 4) { 
        throw new Error(`Input too large for ${level} task.`);
    }

    // Bug 24 Fix: Removed 'chart_qa' from grounding exemptions. 
    // chart_qa MUST have grounding data to prevent hallucination/injection.
    const needsGrounding = !['chat_conversation', 'MARKET_EVENT_EXTRACTION', 'future_vision_prediction'].includes(request.taskType);
    if (needsGrounding && (!request.data || Object.keys(request.data).length === 0)) {
        throw new Error(`Task type '${request.taskType}' requires grounding data (request.data) to prevent hallucination.`);
    }

    return true;
}
