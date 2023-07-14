import GameContext, { PlayerEnt } from "../../engine/GameContext";
import CAgent from "../../engine/comps/CAgent";
import EcsManager, { EntIdType } from "../../infra/Ecs";
import RingBuffer from "../../infra/RingBuffer";
import { IGptAgent, CommandResponseApiModel, CommandStateInterrupted } from "./GptAgentManager";
import { IAiCommandService } from "./IAiCommandService";


export default class PlayerCommandService implements IAiCommandService {

  private readonly _commandQueue: RingBuffer<CommandResponseApiModel> = new RingBuffer(20);
  private _resolveNextCommand: ((value: CommandResponseApiModel | PromiseLike<CommandResponseApiModel>) => void) | null = null;
  private _nextCommandPromise: Promise<CommandResponseApiModel> | null = null;

  public async getNextCommand(prompt: string, agent: IGptAgent, userInput: string): Promise<CommandResponseApiModel> {
    console.log('get next command?');
    if (this._commandQueue.size !== 0 && !this._nextCommandPromise) return this._commandQueue.pop();
    if (this._nextCommandPromise) return this._nextCommandPromise;

    // otherwise construct a promise to return once we get user input from the player
    this._nextCommandPromise = new Promise((resolve, ) => {
      this._resolveNextCommand = resolve;
    });

    return this._nextCommandPromise;
  }

  public addCommands(...commands: CommandResponseApiModel[]) {
    for (const command of commands) {
      this._commandQueue.push(command);
    }
    this.maybeResolvePromise();
  }

  public setCommands(...commands: CommandResponseApiModel[]) {
    this.clearCommands();
    this.addCommands(...commands);
  }

  public clearCommands() {
    this._commandQueue.clear();
  }

  public interrupt(playerEntId: EntIdType, ecs: EcsManager, interruptReason: string, nextCommand?: CommandResponseApiModel) {
    const playerAgent = ecs.getComponent(playerEntId, CAgent);
    if (!playerAgent) throw new Error('Player agent does not exist!');
    if (playerAgent.currentCommand) {
      if (playerAgent.interrupt) throw new Error('Player already has interrupt!');
      playerAgent.interrupt = new CommandStateInterrupted(interruptReason);
    }

    if (nextCommand) {
      this.setCommands(nextCommand);
    }
  }

  public getCommandResponse(commandName: string, args: Record<string, any>): CommandResponseApiModel {
    return {
      "thoughts":
      {
          "text": "",
          "reasoning": "",
          "plan": "",
          "criticism": "",
      },
      "command": {
          "name": commandName,
          "args": args,
      }
    }
  }

  private maybeResolvePromise() {
    if (this._commandQueue.isEmpty()) return;
    if (!this._nextCommandPromise) return;
    if (!this._resolveNextCommand) return;
    this._resolveNextCommand(this._commandQueue.pop());
    this._resolveNextCommand = null;
    this._nextCommandPromise = null;
  }
}
