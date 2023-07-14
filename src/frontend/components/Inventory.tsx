import React, { FC, useState } from 'react';
import '../styles/components/Inventory.css';
import InventoryState from '../engine/InventoryState';

export interface InventoryProps {
  context?: InventoryState;
}

const Inventory: FC<InventoryProps> = ({ context }) => {

  const [activeItem, setActiveItem] = useState<string | null>(null);

  const handleClick = (itemName: string) => {
    setActiveItem(itemName === activeItem ? null : itemName);
  };

  const showInventory = !!(context?.selectedEntId);
  if (!showInventory) {
    return <div />;
  }

  const items = context.items;
  const giveCoins = context.giveCoins;
  return (
    <div className="inventory-container">
      <div className="inventory">
        <div className="inventory-title">{context.agentName}</div>
        <div className="inventory-item-text"
          onClick={() => handleClick('coins')}
        > 
          Coins: {context.coins}
          {activeItem === 'coins' && giveCoins && (
              <div className="inventory-options">
                <div className="inventory-option" onClick={() => giveCoins(50)}>
                  Give
                </div>
              </div>
            )}
        </div>

        {items.map((item, index) => (
          // <img
          //   key={index}
          //   src={item.icon}
          //   alt="Inventory Item"
          //   className="inventory-item"
          //   onClick={item.onClick}
          // />
          <div
            key={index}
            className="inventory-item-text"
            onClick={() => handleClick(item.name)}
            data-tooltip={activeItem ? undefined : item.description ?? 'This item is missing a description, but probably does something'}
          >
            {item.name}
            {item.name === activeItem && (
              <div className="inventory-options">
                {item.options.map((option, index) => (
                  <div key={index} className="inventory-option" onClick={() => item.onOption(option)}>
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
