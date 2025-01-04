// This is the unified model for the unit that has cloud and device data merged
export interface Level {
  level: number;
  peak: number;
}

export interface EffectSetting {
  index: number;
  labels: string[];
  name: string;
  max: number;
  min: number;
  step: number;
  type: number;
  value: number | boolean;
}
// Data to represent a single pedal
export interface PedalData {
  index: number;
  name: string;
  settings: Array<EffectSetting>;
}

// Data to represent a board
export interface BoardData {
  channel: number;
  boardId: number;
  pedals: Array<PedalData>;
}

// Data representing a saved Board
export interface SavedBoard extends BoardData {
  name: string;
}

// This is the pedal boards loaded.  It's an array (by channel) of BoardData
export type LoadedBoards = Array<BoardData>;

// This is a definition of a pedal the system can manifest
export interface PedalOption {
  label: string;
  value: string;
}

export interface BoardInfo {
  pedalOptions: Array<PedalOption>;
  loadedBoards: LoadedBoards;
}

export interface AudioHardware {
  driver: string;
  cardInfo: string;
}

export enum MidiMessageType {
  noteOff,
  noteOn,
  polyPressure,
  controlChange,
  programChange,
  channelPressure,
  pitchBend,
  systemMessage,
  unknownType,
}

export interface MidiEvent {
  channel: number;
  note: number;
  type: MidiMessageType;
  velocity: number;
}

export interface UpdateMessage {
  text: string;
  time: number;
}

export interface UnitModel {
  masterLevel: Level;
  inputLeft: Level;
  inputRight: Level;
  outputLeft: Level;
  outputRight: Level;
  inputLeftFreq: number;
  inputRightFreq: number;
  leftTunerOn: boolean;
  rightTunerOn: boolean;
  pedalInfo: Array<Array<any>>;
  boardInfo: BoardInfo;
  midiEvent: MidiEvent | null;
  audioHardware: AudioHardware | null;
}
