declare module '@emoji-mart/react' {
  import * as React from 'react';
  export interface PickerProps {
    data: any;
    onEmojiSelect?: (emoji: any) => void;
    theme?: 'light' | 'dark' | 'auto' | string;
  }
  const Picker: React.FC<PickerProps>;
  export default Picker;
}

declare module '@emoji-mart/data' {
  const data: any;
  export default data;
}
