/// This handler provides the interface between the typescript code and the
/// Rust code.  The api between the two sides is formed with 3 function calls.  The
/// first startAudio starts the audio thread and passes in a Channel which the
/// rust side will send event.  There is a stopAudio call to stop the audio thread on
/// the rust side.  Lastly there is a send_command function that will send a RTJamParameter message
/// to effect changes on rust side.
import { Channel, invoke } from "@tauri-apps/api/core";
import { EventDispatcher } from "./eventDispatcher";
import { BoardData, PedalOption, UnitModel } from "../models/UnitModel";

export enum RTJamParameters {
    paramGetConfigJson = 27,
    paramSetEffectConfig,
    paramInsertPedal,
    paramDeletePedal,
    paramMovePedal,
    paramLoadBoard,
    paramTuneChannel,
    paramShutdownAudio = 9999,
  }
  
export interface MidiEvent {
  type: number;
  channel: number;
  note: number;
  velocity: number;
}

interface Dispatchers {
  unit: EventDispatcher;
  levels: EventDispatcher;
  boards: EventDispatcher;
  midi: EventDispatcher;
}

export class UnitHandler {
  lastHeardFrom: Date;
  // event dispatchers organized by topic
  dispatchers: Dispatchers;
  updatedModel: UnitModel;


  constructor() {
    console.log("constructing unitHandler");
    this.lastHeardFrom = new Date();
    this.dispatchers = {
      unit: new EventDispatcher(),
      levels: new EventDispatcher(),
      boards: new EventDispatcher(),
      midi: new EventDispatcher(),
    };
    this.updatedModel = {
      masterLevel: { level: -60, peak: -60 },
      inputLeft: { level: -60, peak: -60 },
      inputRight: { level: -60, peak: -60 },
      outputLeft: { level: -60, peak: -60 },
      outputRight: { level: -60, peak: -60 },
      inputLeftFreq: 0.0,
      inputRightFreq: 0.0,
      leftTunerOn: false,
      rightTunerOn: false,
      pedalInfo: [[], []],
      boardInfo: {
        pedalOptions: [],
        loadedBoards: [
          { channel: 0, boardId: -1, pedals: [] },
          { channel: 1, boardId: -1, pedals: [] },
        ],
      },
      midiEvent: null,
      audioHardware: null,
    };
  }

  processMessage(msg: any) {
    // Process a message from the rust side
    if (msg.levelEvent) {
      this.updatedModel.inputLeft = msg.levelEvent.inputLeft;
      this.updatedModel.inputRight = msg.levelEvent.inputRight;
      this.updatedModel.outputLeft = msg.levelEvent.outputLeft;
      this.updatedModel.outputRight = msg.levelEvent.outputRight;
      this.dispatchers.levels.publish(this.updatedModel);
    }
    if (msg.pedalTypes) {
      const pedalOptions = [];
      for (const key in msg.pedalTypes) {
        pedalOptions.push({ value: key, label: msg.pedalTypes[key] });
      }
      this.setPedalTypes(pedalOptions);
    }
    if (msg.pedalInfo) {
      const rval = msg.pedalInfo;
      if (Array.isArray(rval) && rval.length === 2 && rval[0].effects && rval[1].effects) {
        this.setLoadedBoards([
          { channel: 0, boardId: rval[0].boardId, pedals: rval[0].effects },
          { channel: 1, boardId: rval[1].boardId, pedals: rval[1].effects },
        ]);
      }
    }
  }

  apiFunction(msg: any) {
    invoke("commandmsg", {msg: msg} );
  }

  async startAudio(callback_func: any) {
    console.log("starting audio");
    const ev = new Channel<string>;
    ev.onmessage = callback_func;
    console.log(
      await invoke("start", {
        onEvent: ev,
        inDev: "hw:CODEC",
        outDev: "hw:CODEC",
      })
    );
  }

  stopAudio() {
    invoke("stop", {});
  }

  setLoadedBoards(loadedBoards: BoardData[]) {
    this.updatedModel.boardInfo.loadedBoards = loadedBoards;
    this.dispatchers.boards.publish(this.updatedModel);
  }

  setMidiEvent(midiEvent: MidiEvent) {
    this.updatedModel.midiEvent = midiEvent;
    this.dispatchers.midi.publish(this.updatedModel);
  }

  setPedalTypes(pedalOptions: PedalOption[]) {
    this.updatedModel.boardInfo.pedalOptions = pedalOptions;
  }

  setAudioHardware(driver: string, cardInfo: string) {
    this.updatedModel.audioHardware = {
      driver: driver,
      cardInfo: cardInfo,
    };
    this.dispatchers.unit.publish(this.updatedModel);
  }

  // Subsscription Functions
  subscribe(topic: "unit" | "levels" | "boards" | "midi", keyName: string, callbackFunc: any) {
    this.dispatchers[topic].subscribe(keyName, callbackFunc);
  }

  unsubscribe(topic: "unit" | "levels" | "boards" | "midi", keyName: string) {
    this.dispatchers[topic].unsubscribe(keyName);
  }

  // API functions

  dumpModelToConsole() {
    console.log(this.updatedModel);
  }

  refreshPedalConfig() {
    this.apiFunction({ param: RTJamParameters.paramGetConfigJson });
  }

  setEffectSetting(channel: number, effect: number, name: string, value: any) {
    const setting = {
      name: name,
      value: value,
    };
    this.apiFunction({
      param: RTJamParameters.paramSetEffectConfig,
      sValue: JSON.stringify(setting),
      iValue1: channel,
      iValue2: effect,
    });
  }

  insertPedal(channel: number, idx: number, pedalType: string) {
    this.apiFunction({
      param: RTJamParameters.paramInsertPedal,
      sValue: pedalType,
      iValue1: channel,
      iValue2: idx,
    });
  }

  deletePedal(channel: number, idx: number) {
    this.apiFunction({
      param: RTJamParameters.paramDeletePedal,
      iValue1: channel,
      iValue2: idx,
    });
  }

  tunerOn(channel: number, isOn: boolean) {
    this.apiFunction({
      param: RTJamParameters.paramTuneChannel,
      iValue1: channel,
      iValue2: isOn ? 1 : 0,
    });
  }

  movePedal(channel: number, fromIdx: number, toIdx: number) {
    this.apiFunction({
      param: RTJamParameters.paramMovePedal,
      fValue: toIdx,
      iValue1: channel,
      iValue2: fromIdx,
    });
  }

  loadBoardFromConfig(channel: number, config: any) {
    this.apiFunction({
      param: RTJamParameters.paramLoadBoard,
      iValue1: channel,
      sValue: JSON.stringify(config),
    });
  }
}
