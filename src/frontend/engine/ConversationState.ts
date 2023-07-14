import { Dispatch, SetStateAction } from "react";
import { EntIdType } from "../infra/Ecs";

export default interface ConversationState {
  readonly agentId: EntIdType;
  readonly agentName: string;
  readonly otherAgentId: EntIdType;
  readonly otherAgentName: string;
  readonly messages: MessageViewModel[];
  readonly playerConversationState?: PlayerConversationState;
}

export interface PlayerConversationState {
  readonly isFinished: boolean;
  readonly waitingForResponse: boolean;
  readonly sendMessage: (text: string) => void;
  // readonly endConversation: (text: string) => void;
  readonly closeConversation: () => void;

  // accept request, decline request
}

export interface MessageViewModel {
  id: number | string;
  text: string;
  sender: 'me' | 'other' | 'system';
}

// const mapConversationToMessages = (conversation: IConversationModel): MessageViewModel[] => {
//   const vms: MessageViewModel[] = [];
//   conversation.messages.forEach(msg => {
//     vms.push({
//       id: msg.id,
//       text: msg.text,
//       sender: msg.sender === "me" ? "me" : "other",
//     });

//     if (msg.errorMessage) {
//       vms.push({
//         id: `error_${msg.id}`,
//         text: msg.errorMessage,
//         sender: "system",
//       })
//     }
//   });
//   return vms;
// }

export type SetConversationState = Dispatch<SetStateAction<ConversationState | undefined>>;