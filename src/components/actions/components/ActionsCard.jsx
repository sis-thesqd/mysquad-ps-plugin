import React from 'react';

/**
 * Actions card with quick action buttons
 */
const ActionsCard = () => {
  return (
    <sp-card heading="Actions">
      <sp-action-group slot="footer" class="action-group-footer">
        <sp-action-button>Button 1</sp-action-button>
        <sp-action-button>Longer Button 2</sp-action-button>
        <sp-action-button>Short 3</sp-action-button>
      </sp-action-group>
    </sp-card>
  );
};

export default ActionsCard;
