import { Vec2 } from "../../infra/LinAlg";
import { CommandGenerator, CommandResponseApiModel, CommandState, IGptAgent } from "../../libs/gpt-agents/GptAgentManager";
import { GptMessage } from "../../libs/gpt-agents/GptMessage";
import { IAiCommandService } from "../../libs/gpt-agents/IAiCommandService";

export type AgentActionType = "standby" | "move";

export default class CAgent implements IGptAgent {

  constructor(agentSlug: string, aiModel: IAiCommandService) {
    this.aiModel = aiModel;
    this.agentSlug = agentSlug;
  }

  targetGridPos: Vec2 | null = null;
  movementPath: Vec2[] | null = null;
  movementPathIndex: number = -1;
  currentAction: AgentActionType = "standby";

  // IGptAgentFields
  nextCommand?: Promise<CommandResponseApiModel>;
  currentCommand: CommandGenerator | null = null;
  fullMessageHistory: GptMessage[] = [];
  aiModel: IAiCommandService;
  agentSlug: string;
  lastResponseTime: number = Date.now();
  interrupt?: CommandState;

  get currentPathPos(): Vec2 | null {
    // return null if path is invalid
    if (!this.movementPath) return null;
    if (this.movementPathIndex === null) return null;
    if (this.movementPathIndex < 0) return null;
    if (this.movementPathIndex >= this.movementPath.length) return null;
    return this.movementPath[this.movementPathIndex];
  }

  public resetAgentMovement() {
    // if (agent.currentAction !== "move") return;
    this.movementPath = null;
    this.movementPathIndex = -1;
    this.targetGridPos = null;
    this.currentAction = "standby";
  }
}