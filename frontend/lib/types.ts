export interface SelectedFile {
  file: File;
  name: string;
  type: string;
  size: number;
}

export interface ChatPanelProps {
  tokenId: string;
  personaName: string;
}

export interface Message {
  parts: any;
  id: string;
  role: "user" | "assistant";
  content: string;
}
