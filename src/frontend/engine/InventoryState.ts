import { Dispatch, SetStateAction } from "react";

export default interface InventoryState {
  readonly selectedEntId: number
  readonly agentName: string
  readonly coins: number;
  readonly items: InventoryItem[];
  giveCoins?: (amount: number) => void;
}

export interface InventoryItem {
  name: string;
  description?: string;
  options: string[];
  // icon: string;
  onOption: (option: string) => void;
}

export type SetInventoryState = Dispatch<SetStateAction<InventoryState | undefined>>;