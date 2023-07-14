import { EntIdType } from "../../infra/Ecs";
import promiseState from "../../infra/PromiseState";
import { GptMessage, createGptMessage } from "./GptMessage";
import { IAiCommandService } from "./IAiCommandService";

export interface IGptCommand<TContext extends IGptAgentContext> {
  readonly commandName: string;
  readonly shortSummary: string;
  readonly longSummary: string;
  readonly defineArgs: Record<string, string>; // eg "target": "<character_slug>"
  commandGenerator: (context: TContext, commandArgs: Record<string, any>) => CommandGenerator
  isAvailable: (context: TContext, worldState: WorldState) => boolean;
}

export function getCommandDescription<T extends IGptAgentContext>(c: IGptCommand<T>): string {
  let argsString = Object.entries(c.defineArgs)
    .map(([k, v]) => `"${k}": "<${v}>"`)
    .join(", ");
  return `${c.shortSummary}: "${c.commandName}", args: ${argsString ?? ""}`
}

export interface IGptAgent {
  // todo memory
  fullMessageHistory: GptMessage[];
  aiModel: IAiCommandService;
  nextCommand?: Promise<CommandResponseApiModel>;
  currentCommand: CommandGenerator | null;
  agentSlug: string;
  lastResponseTime: number;
  interrupt?: CommandState;
}

export interface IGptAgentContext {
  gptAgent: IGptAgent;
  getPrompt: (commandDescriptions: string) => string;
  getWorldState: () => WorldState;
}

export default class GptAgentManager<TContext extends IGptAgentContext> {

  private readonly _commands: Map<string, IGptCommand<TContext>>;
  private readonly _commandDescriptions: Map<string, string> = new Map();

  // pass in a list of commands
  constructor(commands: IGptCommand<TContext>[]) {
    this._commands = new Map();
    for (const command of commands) {
      if (this._commands.has(command.commandName)) {
        throw new Error(`Duplicate commands with name ${command.commandName}`)
      }
      this._commands.set(command.commandName, command);
      this._commandDescriptions.set(command.commandName, getCommandDescription(command))
    }
  }

  public getAvailbleCommandDescriptions(context?: TContext, worldState?: WorldState): string {
    const available: string[] = [];
    for (const [k, v] of this._commandDescriptions) {
      const command = this._commands.get(k)!;
      if (context && worldState && !command.isAvailable(context, worldState)) continue;
      available.push(v);
    }
    return available.join('\n');
  }

  public getCommand(commandName: string): IGptCommand<TContext> | undefined {
    // if (!this._commands.has(commandName)) {
    //   throw new Error(`No command with name ${commandName} exists`);
    // }
    return this._commands.get(commandName)!;
  }

  public async process(context: TContext) {
    // get agent from context
    const agent = context.gptAgent;

    // TODO check for interrupt observers?
    if (agent.interrupt) {
      // should interrupts be a ring buffer instead.
      // on an interrupt you just pop the first?
      const interrupt = agent.interrupt;
      console.log('has interrupt?');
      this.returnCommandResultToGpt(interrupt, context)
      return;
    }

    // TODO update memory and fullMessageHistory where appropriate.
    if (agent.nextCommand) {
      // probs better perfwise to use a then based appraoch that adds the result to a queue
      // but i like this architecture better
      const nextCommandState = await promiseState(agent.nextCommand);

      // do nothing if promise is still pending
      // return rather than process interupts because we
      // want to limit the rate of api calls to ai chat service
      if (nextCommandState.status === 'pending') return;

      // if error, see what happend and try again
      if (nextCommandState.status === 'rejected') {
        console.log(`rejected reason on promise: ${nextCommandState.reason}`);

        // clear command for now avoid error from reoccuring
        // agent.nextCommand = undefined;
        // throw new Error("Unknown error occured communicating getting next command");

        // todo try again based on reason... or don't since we couldn't process the response
        this.returnCommandResultToGpt(new CommandStateError([nextCommandState.reason]), context);
        return;
      }

      // otherwise we must have a successful response with the next command
      const response = nextCommandState.value;
      agent.fullMessageHistory.push(createGptMessage("assistant", JSON.stringify(response)));

      // get processor for next command
      const command = this.getCommand(response.command.name);
      if (!command) {
        const commandError = new CommandStateError([`No command with name ${response.command.name} exists`]);
        console.log(commandError);
        this.returnCommandResultToGpt(commandError, context);
        return;
      }

      agent.currentCommand = command.commandGenerator(context, response.command.args);
      agent.nextCommand = undefined; // clear next command
    }

    // TODO or check for interrupts here?

    // if there is a current command and its finished, return to ai chat service
    if (!agent.currentCommand) return;
    const commandState = agent.currentCommand.next();
    if (commandState.done === undefined || !commandState.done) return;
    this.returnCommandResultToGpt(commandState.value, context);
  }


  private returnCommandResultToGpt(commandResult: CommandState, context: TContext) {
    console.log('command result:');
    console.log(commandResult);

    const agent = context.gptAgent;
    const worldState = context.getWorldState();
    // const availableCommands = this.getAvailableCommands(context, worldState);
    const prompt = context.getPrompt(this.getAvailbleCommandDescriptions(context, worldState));
  
    agent.currentCommand = null; // clear the current command process as its finished
    agent.interrupt = undefined;
    // TODO get awareness

    const result: CommandResult = {
      commandResult,
      yourState: worldState,
      //availableCommands,
    }
    // update agent.nextCommand to promise making appropriate api call to chatgpt 

    // should we always record the world state?
    // agent.fullMessageHistory.push(createGptMessage("user", `Command returned: ${JSON.stringify(result)}\n`));
    // agent.nextCommand = agent.aiModel.getNextCommand(prompt, agent, 'GENERATE NEXT COMMAND JSON');

    agent.fullMessageHistory.push(createGptMessage("user", `Command returned: ${JSON.stringify(commandResult)}\n`));
    agent.nextCommand = agent.aiModel.getNextCommand(
      prompt, agent, 
      `Your current status: {${JSON.stringify(worldState)}}\nGENERATE NEXT COMMAND JSON`);
  }

  private getAvailableCommands(context: TContext, worldState: WorldState) {
    const available: string[] = [];
    for (const [, schema] of this._commands.entries()) {
      if (schema.isAvailable(context, worldState)) {
        available.push(schema.commandName);
      }
    }
    return available;
  }
}

export interface Item {
  itemId: EntIdType,
  description: string,
}

export interface Person {
  characterId: EntIdType,
  name: string,
}

// todo eventually generalize this too...
// make it so can add onChange listeners to world state fields, or maybe just 
// nearby people and items, or just auto interrupt on item and people changes
export interface WorldState {
  location: string;
  // activeConversation: string | null;
  inventory: Item[];
  coins: number;
  // monsters: string[];
  nearbyPeople: Person[];
  nearbyItems: Item[];
  energy: string;
}

export interface CommandObserver {
  characterSlug: string;
  command: CommandApiModel;
}

interface CommandEvent {
  agentSlug: string;
  eventTime: Date;
  command: CommandApiModel;
  result: CommandState;
}

export interface CommandResult {
  commandResult: CommandState;
  // registeredCommandObservers: CommandObserver[];
  yourState: WorldState;
  //availableCommands: string[];
  // awareness: CommandEvent[]; include all events in command result that have occurred since last response
}

export interface CommandResponseApiModel {
  thoughts: {
    text: string;
    reasoning: string;
    plan: string;
    criticism: string;
  };
  command: CommandApiModel;
}

export interface CommandApiModel {
  name: string;
  args: Record<string, string>;
}

export type CommandStateStatus = 'completed' | 'failed' | 'error' | 'interrupted';
export type CommandState = CommandStateFailed | CommandStateCompleted | CommandStateError | CommandStateInterrupted;

export class CommandStateCompleted {
  readonly status: CommandStateStatus = "completed";
  constructor(public value: any) { }
}

export class CommandStateFailed {
  readonly status: CommandStateStatus = "failed";
  constructor(public reason: string) { }
}

export class CommandStateInterrupted {
  readonly status: CommandStateStatus = "interrupted";
  constructor(public reason: string) { }
}


export class CommandStateError {
  readonly status: CommandStateStatus = "error";
  constructor(public errors: string[]) { }
}

export type CommandGenerator = Generator<unknown, CommandState>;
