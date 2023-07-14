import LocationService from "./LocationService";
import EcsManager, { EntIdType } from "../../infra/Ecs";
import ConversationState, { MessageViewModel, PlayerConversationState, SetConversationState } from "../ConversationState";
import CAgent from "../comps/CAgent";
import { CommandStateCompleted, CommandStateInterrupted } from "../../libs/gpt-agents/GptAgentManager";
import GameContext from "../GameContext";
import npcData from "../../../data/npcs/NpcData";
import SaySomethingCommand from "../commands/SaySomethingCommand";
import PlayerCommandService from "../../libs/gpt-agents/PlayerCommandService";

interface ActiveConversation {
  readonly agentId: EntIdType,
  readonly otherAgentId: EntIdType,
  readonly isAgentPlayer: boolean,
}

// todo should persist conversations with a repository
interface ConversationMessage {
  sender: 'me' | 'other' | 'system';
  content: string;
  timestamp: number;
}

export default class ConversationService {

  private _activeConversation?: ActiveConversation;
  private _conversations: Map<EntIdType, Map<EntIdType, ConversationMessage[]>> =  new Map();

  constructor(
    private readonly _setConversationState: SetConversationState,
    private readonly _locationService: LocationService,
    private readonly _playerCommandService: PlayerCommandService,
  ) {

  }

  public clearActiveConversation() {
    this._activeConversation = undefined;
    this._setConversationState(undefined);
  }

  public setActiveConversation(gc: GameContext, ecs: EcsManager, agentId: EntIdType, otherAgentId: EntIdType) {
    this._activeConversation = {
      agentId,
      otherAgentId,
      isAgentPlayer: gc.playerEnt?.eid === agentId,
    }
    this.updateConversationState(ecs);
  }

  public saySomething(ecs: EcsManager, agentId: EntIdType, otherAgentId: EntIdType, msg: string) {
    const agent = ecs.getComponent(agentId, CAgent);
    if (!agent) throw new Error('Agent does not have CAgent component');
    const otherAgent = ecs.getComponent(otherAgentId, CAgent);
    if (!otherAgent) throw new Error('OtherAgent does not have CAgent component');

    // if (otherAgent.interrupt) throw new Error('OtherAgent already has interrupt');
    otherAgent.interrupt = new CommandStateInterrupted(`Character ${agentId} says: "${msg}"`);

    this.addMessage(agentId, otherAgentId, msg);
    this.updateConversationState(ecs);
  }

  private getConversation(fromAgent: EntIdType, toAgent: EntIdType): ConversationMessage[] {
    if (!this._conversations.has(fromAgent)) {
      this._conversations.set(fromAgent, new Map());
    }
    const agentConversations = this._conversations.get(fromAgent)!;

    if (!agentConversations.has(toAgent)) {
      agentConversations.set(toAgent, []);
    }
    return agentConversations.get(toAgent)!;
  }

  private addMessage(fromAgent: EntIdType, toAgent: EntIdType, message: string) {
    const timestamp = Date.now();
    const agentConversation = this.getConversation(fromAgent, toAgent);
    agentConversation.push({
      timestamp,
      sender: 'me',
      content: message,
    });
    const otherConversation = this.getConversation(toAgent, fromAgent);
    otherConversation.push({
      timestamp,
      sender: 'other',
      content: message,
    });
  }

  public addSystemMessage(ecs: EcsManager, agent: EntIdType, otherAgent: EntIdType, message: string) {
    const timestamp = Date.now();
    const agentConversation = this.getConversation(agent, otherAgent);
    const otherConversation = this.getConversation(otherAgent, agent);
    const sysMessage : ConversationMessage = {
      timestamp,
      sender: 'system',
      content: message,
    }
    agentConversation.push(sysMessage);
    otherConversation.push(sysMessage);
    this.updateConversationState(ecs);
  }

  private updateConversationState(ecs: EcsManager) {

    // do nothing if active conversation isn't between these two agents
    if (!this._activeConversation) return;
    const agentId = this._activeConversation.agentId;
    const otherAgentId = this._activeConversation.otherAgentId;

    const agent = ecs.getComponent(agentId, CAgent);
    if (!agent) throw new Error('Agent does not have CAgent component');
    const otherAgent = ecs.getComponent(otherAgentId, CAgent);
    if (!otherAgent) throw new Error('OtherAgent does not have CAgent component');
    const conversation = this.getConversation(agentId, otherAgentId);
    
    const agentName = npcData.get(agent.agentSlug)?.name ?? '';
    const otherAgentName = npcData.get(otherAgent.agentSlug)?.name ?? '';

    // map messages
    const messages: MessageViewModel[] = conversation.map((v, i) => ({
      id: i,
      text: v.content,
      sender: v.sender,
    }));

    let playerConversationState: PlayerConversationState | undefined = undefined;
    if (this._activeConversation.isAgentPlayer) {
      // const lastMessage = conversation[conversation.length - 1];
      playerConversationState = {
        // isFinished: lastMessage?.sender === 'finish',
        // waitingForResponse: lastMessage?.sender === 'me', // if player sent the last message than that means they're waiting
        isFinished: false,
        waitingForResponse: false,
        sendMessage: (text: string) => {
          const command = new SaySomethingCommand();
          console.log("issued say something command");
          const nextCommand = this._playerCommandService.getCommandResponse(command.commandName, { characterId: otherAgentId, message: text });
          this._playerCommandService.interrupt(agentId, ecs, 'Player issued new command', nextCommand);
        },
        closeConversation: () => {
          this._activeConversation = undefined;
          this._setConversationState(undefined);
        },
      }    
    }

    const conversationState: ConversationState = {
      agentId,
      otherAgentId,
      messages,
      agentName,
      otherAgentName,
      playerConversationState,
    };

    this._setConversationState(conversationState);
  }


}