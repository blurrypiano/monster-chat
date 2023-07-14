import npcData from "../../../data/npcs/NpcData";
import { getPrompt } from "../../../data/prompts";
import EcsManager, { EntsWith, EntWith } from "../../infra/Ecs";
import GptAgentManager, { IGptAgent, IGptAgentContext, Item, Person, WorldState } from "../../libs/gpt-agents/GptAgentManager";
import CheckMapCommand from "../commands/CheckMapCommand";
import SaySomethingCommand from "../commands/SaySomethingCommand";
import DoNothingCommand from "../commands/DoNothingCommand";
import DropItemCommand from "../commands/DropItemCommand";
import FollowCommand from "../commands/FollowCommand";
import GoToCommand from "../commands/GoToCommand";
import GoToLocationCommand from "../commands/GoToLocationCommand";
import PickUpItemCommand from "../commands/PickUpItemCommand";
import UseItemCommand from "../commands/UseItemCommand";
import CAgent from "../comps/CAgent";
import CGridCollider from "../comps/CGridCollider";
import CHealth from "../comps/CHealth";
import { CInventory, CItem } from "../comps/CInventory";
import CSprite from "../comps/CSprite";
import GameContext from "../GameContext";
import GiveItemCommand from "../commands/GiveItemCommand";
import GiveCoinsCommand from "../commands/GiveCoinsCommand";

type CompOrder = [CAgent];
const constructors = [CAgent];

export class GameAgentContext implements IGptAgentContext {

  public gptAgent: IGptAgent;

  constructor(
    public readonly gc: GameContext,
    public readonly ecs: EcsManager,
    public readonly agentEnt: EntWith<[CAgent]>
  ) {
    const [, [agent]] = agentEnt;
    this.gptAgent = agent;
  }

  public get agent() {
    const [, [agent]] = this.agentEnt;
    return agent;
  }

  public get eid() {
    const [eid,] = this.agentEnt;
    return eid;
  }

  public getPrompt(commandDescriptions: string): string {
    const [, [agent]] = this.agentEnt;
    const npcInfo = npcData.get(agent.agentSlug)!;
    return getPrompt(npcInfo.personalHistory, npcInfo.goals, commandDescriptions);
  }

  public getWorldState(): WorldState {
    const [agentId, [agent]] = this.agentEnt;
    const collider = this.ecs.getComponent(agentId, CGridCollider);
    const sprite = this.ecs.getComponent(agentId, CSprite);
    const hc = this.ecs.getComponent(agentId, CHealth);
    const npcInfo = npcData.get(agent.agentSlug)!;
    const locationInfo = this.gc.locationService.lookup(sprite.gridPos!);

    const nearbyEids = this.gc.locationService.getIdsInRegion(sprite.gridPos!, 8);
    const items: Item[] = nearbyEids
      .filter(eid => this.ecs.hasComponent(eid, CItem))
      .map((eid) => {
        const item = this.ecs.getComponent(eid, CItem);
        return { itemId: eid, description: item.def.description }
      });

    const people: Person[] = nearbyEids
      .filter(eid => this.ecs.hasComponent(eid, CAgent))
      .filter(eid => agentId !== eid)
      .map((eid) => {
        const agent = this.ecs.getComponent(eid, CAgent);
        var npcInfo = npcData.get(agent.agentSlug)!;
        return { characterId: eid, name: npcInfo.name }
      });

    const inventory = this.ecs.getComponent(agentId, CInventory);
    const agentItems: Item[] = inventory.items
      .map((eid) => {
        const item = this.ecs.getComponent(eid, CItem);
        return { itemId: eid, description: item.def.description }
      });

    return {
      location: locationInfo?.description ?? "",
      // activeConversation: null,
      inventory: agentItems,
      coins: inventory.coins,
      // monsters: [],
      nearbyPeople: people,
      nearbyItems: items,
      energy: `${Math.floor(hc.health)} / ${hc.maxHealth}`
    };
  }
}

export default class AgentCommandSystem {

  public readonly gptAgentManager: GptAgentManager<GameAgentContext> = new GptAgentManager([
    new DoNothingCommand(),
    new GoToLocationCommand(),
    new GoToCommand(),
    new PickUpItemCommand(),
    new CheckMapCommand(),
    new UseItemCommand(),
    new DropItemCommand(),
    new FollowCommand(),
    new SaySomethingCommand(),
    new GiveItemCommand(),
    new GiveCoinsCommand(),
  ]);

  public init(gc: GameContext, ecs: EcsManager) {
    const ents: EntsWith<CompOrder> = ecs.getEntsWith(...constructors);
    for (const ent of ents) {
      const gac = new GameAgentContext(gc, ecs, ent);
      // set first command if agent hasn't started
      if (!gac.gptAgent.nextCommand && !gac.gptAgent.currentCommand) {
        const prompt = gac.getPrompt(this.gptAgentManager.getAvailbleCommandDescriptions());
        gac.gptAgent.nextCommand = gac.gptAgent.aiModel.getNextCommand(prompt, gac.gptAgent, 'GENERATE NEXT COMMAND JSON');
      }
    }
  }

  public async runAsync(gc: GameContext, ecs: EcsManager): Promise<void> {
    const ents: EntsWith<CompOrder> = ecs.getEntsWith(...constructors);
    for (const ent of ents) {
      const gac = new GameAgentContext(gc, ecs, ent);
      await this.gptAgentManager.process(gac);
    }
  }
}
