// DynamicBlock.js
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

class BlockObject {
  constructor(name, color, tooltip, code, inputs) {
    this.name = name;
    this.color = color;
    this.tooltip = tooltip;
    this.code = code;
    this.inputs = inputs;
  }

  createBlock() {
    Blockly.Blocks[this.name] = {
      init: function() {
        // הוספת שדות קלט דינמיים
        for (const input of this.inputs) {
          if (input.type === 'dummy') {
            this.appendDummyInput()
              .appendField(input.text);
          } else if (input.type === 'value') {
            this.appendValueInput(input.name)
              .setCheck(input.check)
              .appendField(input.text);
          } else if (input.type === 'statement') {
            this.appendStatementInput(input.name)
              .setCheck(input.check)
              .appendField(input.text);
          }
        }

        this.setTooltip(this.tooltip);
        this.setColour(this.color);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      }
    };

    javascriptGenerator.forBlock[this.name] = function(block) {
      return [this.code, javascriptGenerator.ORDER_ATOMIC];
    }.bind(this);
  }
}

export default BlockObject;