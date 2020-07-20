import { Reducer } from "preact/hooks";
import { Program, TProgram, IProgram, IProgramInternalState } from "../models/program";
import { IHistoryRecord, THistoryRecord } from "../models/history";
import { Progress, IProgressMode } from "../models/progress";
import { IExcerciseType } from "../models/excercise";
import { StateError } from "./stateError";
import { History } from "../models/history";
import { Screen, IScreen } from "../models/screen";
import { TStats } from "../models/stats";
import { IWeight } from "../models/weight";
import deepmerge from "deepmerge";
import { CollectionUtils } from "../utils/collection";
import { Service } from "../api/service";
import { AudioInterface } from "../lib/audioInterface";
import { DateUtils } from "../utils/date";
import { runMigrations } from "../migrations/runner";
import { ILensRecordingPayload, lf } from "../utils/lens";
import { ISettings, TSettings } from "../models/settings";
import * as IDB from "idb-keyval";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";
import RB from "rollbar";
import { IProgramSet } from "../models/set";
import { ScriptRunner } from "../parser";
import { IDispatch } from "./types";

declare let Rollbar: RB;

export type IEnv = {
  service: Service;
  audio: AudioInterface;
  googleAuth?: gapi.auth2.GoogleAuth;
};

export interface IState {
  email?: string;
  storage: IStorage;
  programs: IProgram[];
  webpushr?: IWebpushr;
  screenStack: IScreen[];
  currentHistoryRecord?: number;
  progress: Record<number, IHistoryRecord | undefined>;
  editProgram?: {
    id: string;
    dayIndex?: number;
  };
}

export const TStorage = t.type(
  {
    id: t.number,
    stats: TStats,
    history: t.array(THistoryRecord),
    settings: TSettings,
    currentProgramId: t.union([t.string, t.undefined]),
    version: t.string,
    programs: t.array(TProgram),
  },
  "TStorage"
);
export type IStorage = t.TypeOf<typeof TStorage>;

export interface IWebpushr {
  sid: number;
}

export interface ILocalStorage {
  storage?: IStorage;
  progress?: IHistoryRecord;
}

export function updateState(dispatch: IDispatch, lensRecording: ILensRecordingPayload<IState>[]): void {
  dispatch({ type: "UpdateState", lensRecording });
}

export async function getInitialState(client: Window["fetch"], rawStorage?: string): Promise<IState> {
  if (rawStorage == null) {
    rawStorage = window.localStorage.getItem("liftosaur") || undefined;
  }
  let storage: ILocalStorage | undefined;
  if (rawStorage != null) {
    try {
      storage = JSON.parse(rawStorage);
    } catch (e) {
      storage = undefined;
    }
  }
  if (storage != null && storage.storage != null) {
    const finalStorage = await runMigrations(client, storage.storage);
    validateStorage(finalStorage, TStorage, "storage");
    const isProgressValid =
      storage.progress != null ? validateStorage(storage.progress, THistoryRecord, "progress") : false;

    const screenStack: IScreen[] = finalStorage.currentProgramId ? ["main"] : ["programs"];

    return {
      storage: finalStorage,
      progress: isProgressValid ? { 0: storage.progress } : {},
      programs: [],
      currentHistoryRecord: 0,
      screenStack,
    };
  }
  return {
    screenStack: ["programs"],
    progress: {},
    programs: [],
    storage: {
      id: 0,
      stats: {
        excercises: {},
      },
      currentProgramId: undefined,
      settings: {
        plates: [
          { weight: 45, num: 4 },
          { weight: 25, num: 4 },
          { weight: 10, num: 4 },
          { weight: 5, num: 4 },
          { weight: 2.5, num: 4 },
          { weight: 1.25, num: 2 },
        ],
        bars: {
          barbell: 45,
          ezbar: 20,
          dumbbell: 10,
        },
        timers: {
          warmup: 90,
          workout: 180,
        },
      },
      history: [],
      version: DateUtils.formatYYYYMMDDHHMM(Date.now()),
      programs: [],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateStorage(data: object, type: t.Type<any, any, any>, name: string): boolean {
  const decoded = type.decode(data);
  if ("left" in decoded) {
    const error = PathReporter.report(decoded);
    if (Rollbar != null) {
      Rollbar.error(error.join("\n"), { state: JSON.stringify(data), type: name });
    }
    console.error(`Error decoding ${name}`);
    error.forEach((e) => console.error(e));
    return false;
  } else {
    return true;
  }
}

export type IChangeDate = {
  type: "ChangeDate";
  date: string;
};

export type IConfirmDate = {
  type: "ConfirmDate";
  date?: string;
};

export type ISyncStorage = {
  type: "SyncStorage";
  storage: IStorage;
};

export type ILoginAction = {
  type: "Login";
  email: string;
};

export type ILogoutAction = {
  type: "Logout";
};

export type IPushScreen = {
  type: "PushScreen";
  screen: IScreen;
};

export type IPullScreen = {
  type: "PullScreen";
};

export type ICancelProgress = {
  type: "CancelProgress";
};

export type IDeleteProgress = {
  type: "DeleteProgress";
};

export type IChangeRepsAction = {
  type: "ChangeRepsAction";
  excercise: IExcerciseType;
  setIndex: number;
  weight: number;
  mode: IProgressMode;
};

export type IFinishProgramDayAction = {
  type: "FinishProgramDayAction";
};

export type IStartProgramDayAction = {
  type: "StartProgramDayAction";
};

export type IChangeAMRAPAction = {
  type: "ChangeAMRAPAction";
  value?: number;
};

export type IChangeWeightAction = {
  type: "ChangeWeightAction";
  weight: number;
  excercise: IExcerciseType;
};

export type IConfirmWeightAction = {
  type: "ConfirmWeightAction";
  weight?: IWeight;
};

export type IUpdateSettingsAction = {
  type: "UpdateSettings";
  lensRecording: ILensRecordingPayload<ISettings>;
};

export type IUpdateStateAction = {
  type: "UpdateState";
  lensRecording: ILensRecordingPayload<IState>[];
};

export type IStoreWebpushrSidAction = {
  type: "StoreWebpushrSidAction";
  sid: number;
};

export type IEditHistoryRecordAction = {
  type: "EditHistoryRecord";
  historyRecord: IHistoryRecord;
};

export type IStartTimer = {
  type: "StartTimer";
  timestamp: number;
  mode: IProgressMode;
};

export type IStopTimer = {
  type: "StopTimer";
};

export type ICreateProgramAction = {
  type: "CreateProgramAction";
  name: string;
};

export type ICreateDayAction = {
  type: "CreateDayAction";
};

export type IEditDayAction = {
  type: "EditDayAction";
  index: number;
};

export type IEditDayAddExcerciseAction = {
  type: "EditDayAddExcerciseAction";
  value: IExcerciseType;
};

export type IEditDayAddSetAction = {
  type: "EditDayAddSet";
  excerciseIndex: number;
  set: IProgramSet;
  setIndex?: number;
};

export type IEditDayRemoveSetAction = {
  type: "EditDayRemoveSet";
  excerciseIndex: number;
  setIndex: number;
};

export type IAction =
  | IChangeRepsAction
  | IStartProgramDayAction
  | IFinishProgramDayAction
  | IChangeWeightAction
  | IChangeAMRAPAction
  | IConfirmWeightAction
  | IEditHistoryRecordAction
  | ICancelProgress
  | IDeleteProgress
  | IPushScreen
  | IPullScreen
  | ISyncStorage
  | IChangeDate
  | IConfirmDate
  | ILoginAction
  | ILogoutAction
  | IStartTimer
  | IStopTimer
  | IUpdateStateAction
  | IUpdateSettingsAction
  | IStoreWebpushrSidAction
  | ICreateProgramAction
  | ICreateDayAction
  | IEditDayAction
  | IEditDayAddExcerciseAction
  | IEditDayAddSetAction
  | IEditDayRemoveSetAction;

let timerId: number | undefined = undefined;

export const reducerWrapper: Reducer<IState, IAction> = (state, action) => {
  const newState = reducer(state, action);
  if (state.storage !== newState.storage) {
    newState.storage = {
      ...newState.storage,
      id: (newState.storage.id || 0) + 1,
      version: DateUtils.formatYYYYMMDDHHMM(Date.now()),
    };
  }
  const localStorage: ILocalStorage = {
    storage: newState.storage,
    progress: newState.progress[0],
  };
  if (timerId != null) {
    window.clearTimeout(timerId);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).state = newState;
  timerId = window.setTimeout(() => {
    clearTimeout(timerId);
    timerId = undefined;
    IDB.set("liftosaur", JSON.stringify(localStorage)).catch((e) => {
      console.error(e);
    });
  }, 100);
  return newState;
};

export const reducer: Reducer<IState, IAction> = (state, action): IState => {
  if (action.type === "ChangeRepsAction") {
    let progress = Progress.getProgress(state)!;
    progress = Progress.updateRepsInExcercise(progress, action.excercise, action.weight, action.setIndex, action.mode);
    if (Progress.isFullyFinishedSet(progress)) {
      progress = Progress.stopTimer(progress);
    }
    return Progress.setProgress(state, progress);
  } else if (action.type === "StartProgramDayAction") {
    const progress = state.progress[0];
    if (progress != null) {
      return {
        ...state,
        currentHistoryRecord: progress.id,
        screenStack: Screen.push(state.screenStack, "progress"),
      };
    } else if (state.storage.currentProgramId != null) {
      // TODO: What if the program is missing?
      const program = state.storage.programs.find((p) => p.id === state.storage.currentProgramId)!;
      const newProgress = Program.nextProgramRecord(program, state.storage.settings);
      return {
        ...state,
        currentHistoryRecord: 0,
        screenStack: Screen.push(state.screenStack, "progress"),
        progress: { ...state.progress, 0: newProgress },
      };
    } else {
      return state;
    }
  } else if (action.type === "EditHistoryRecord") {
    return {
      ...state,
      currentHistoryRecord: action.historyRecord.id,
      screenStack: Screen.push(state.screenStack, "progress"),
      progress: { ...state.progress, [action.historyRecord.id]: action.historyRecord },
    };
  } else if (action.type === "FinishProgramDayAction") {
    const progress = Progress.getProgress(state);
    if (progress == null) {
      throw new StateError("FinishProgramDayAction: no progress");
    } else {
      const historyRecord = History.finishProgramDay(progress);
      let newHistory;
      if (!Progress.isCurrent(progress)) {
        newHistory = state.storage.history.map((h) => (h.id === progress.id ? historyRecord : h));
      } else {
        newHistory = [historyRecord, ...state.storage.history];
      }
      // TODO: What if program is missing?
      const program = state.storage.programs.find((p) => p.id === progress.programId)!;
      const bindings = Progress.createScriptBindings(progress);
      const fns = Progress.createScriptFunctions(state.storage.settings);
      const programIndex = state.storage.programs.findIndex((p) => p.id === program.id);
      const newInternalState: IProgramInternalState = {
        nextDay: Program.nextDay(program, program.internalState.nextDay),
      };
      const allProgramState: Record<string, number> = { ...newInternalState, ...program.state };
      new ScriptRunner(program.finishDayExpr, allProgramState, bindings, fns).execute(false);
      const { nextDay, ...programState } = allProgramState;
      return {
        ...state,
        storage: {
          ...state.storage,
          history: newHistory,
          programs: lf(state.storage.programs)
            .i(programIndex)
            .modify((p) => ({ ...p, state: programState, internalState: { nextDay } })),
        },
        screenStack: Screen.pull(state.screenStack),
        currentHistoryRecord: undefined,
        progress: Progress.stop(state.progress, progress.id),
      };
    }
  } else if (action.type === "ChangeAMRAPAction") {
    return Progress.setProgress(state, Progress.updateAmrapRepsInExcercise(Progress.getProgress(state)!, action.value));
  } else if (action.type === "ChangeDate") {
    return Progress.setProgress(state, Progress.showUpdateDate(Progress.getProgress(state)!, action.date));
  } else if (action.type === "ConfirmDate") {
    return Progress.setProgress(state, Progress.changeDate(Progress.getProgress(state)!, action.date));
  } else if (action.type === "ChangeWeightAction") {
    return Progress.setProgress(
      state,
      Progress.showUpdateWeightModal(Progress.getProgress(state)!, action.excercise, action.weight)
    );
  } else if (action.type === "ConfirmWeightAction") {
    return Progress.setProgress(state, Progress.updateWeight(Progress.getProgress(state)!, action.weight));
  } else if (action.type === "StoreWebpushrSidAction") {
    return {
      ...state,
      webpushr: { sid: action.sid },
    };
  } else if (action.type === "CancelProgress") {
    const progress = Progress.getProgress(state)!;
    return {
      ...state,
      currentHistoryRecord: undefined,
      screenStack: Screen.pull(state.screenStack),
      progress: Progress.isCurrent(progress)
        ? state.progress
        : Progress.stop(state.progress, state.currentHistoryRecord!),
    };
  } else if (action.type === "DeleteProgress") {
    const progress = Progress.getProgress(state);
    if (progress != null) {
      const history = state.storage.history.filter((h) => h.id !== progress.id);
      return {
        ...state,
        currentHistoryRecord: undefined,
        screenStack: Screen.pull(state.screenStack),
        storage: { ...state.storage, history },
        progress: Progress.stop(state.progress, progress.id),
      };
    } else {
      return state;
    }
  } else if (action.type === "PushScreen") {
    if (state.screenStack.length > 0 && state.screenStack[state.screenStack.length - 1] !== action.screen) {
      return { ...state, screenStack: Screen.push(state.screenStack, action.screen) };
    } else {
      return state;
    }
  } else if (action.type === "PullScreen") {
    return { ...state, screenStack: Screen.pull(state.screenStack) };
  } else if (action.type === "Login") {
    return { ...state, email: action.email };
  } else if (action.type === "Logout") {
    return { ...state, email: undefined };
  } else if (action.type === "StartTimer") {
    return Progress.setProgress(
      state,
      Progress.startTimer(Progress.getProgress(state)!, action.timestamp, action.mode)
    );
  } else if (action.type === "StopTimer") {
    return Progress.setProgress(state, Progress.stopTimer(Progress.getProgress(state)!));
  } else if (action.type === "UpdateSettings") {
    return {
      ...state,
      storage: {
        ...state.storage,
        settings: action.lensRecording.fn(state.storage.settings),
      },
    };
  } else if (action.type === "UpdateState") {
    return action.lensRecording.reduce((memo, recording) => recording.fn(memo), state);
  } else if (action.type === "SyncStorage") {
    const oldStorage = state.storage;
    const newStorage = action.storage;
    if (newStorage?.id != null && oldStorage?.id != null && newStorage.id > oldStorage.id) {
      const storage: IStorage = {
        id: newStorage.id,
        settings: {
          plates: CollectionUtils.concatBy(oldStorage.settings.plates, newStorage.settings.plates, (el) =>
            el.weight.toString()
          ),
          timers: deepmerge(oldStorage.settings.timers, newStorage.settings.timers),
          bars: newStorage.settings.bars,
        },
        stats: newStorage.stats,
        currentProgramId: newStorage.currentProgramId,
        history: CollectionUtils.concatBy(oldStorage.history, newStorage.history, (el) => el.date!),
        version: newStorage.version,
        programs: newStorage.programs,
      };
      return { ...state, storage };
    } else {
      return state;
    }
  } else if (action.type === "CreateProgramAction") {
    let newState = lf(state)
      .p("storage")
      .p("programs")
      .modify((programs) => [
        ...state.storage.programs,
        {
          isProgram2: true,
          id: action.name,
          name: action.name,
          description: action.name,
          days: [],
          state: {},
          internalState: { nextDay: 1 },
          finishDayExpr: "",
        },
      ]);
    newState = lf(newState).p("editProgram").set({ id: action.name });
    return lf(newState).p("screenStack").set(Screen.push(state.screenStack, "editProgram"));
  } else if (action.type === "EditDayAddExcerciseAction") {
    const programIndex = state.storage.programs.findIndex((p) => p.id === state.editProgram!.id);
    return lf(state)
      .p("storage")
      .p("programs")
      .i(programIndex)
      .p("days")
      .i(state.editProgram!.dayIndex!)
      .p("excercises")
      .modify((e) => [...e, { excercise: action.value, sets: [] }]);
  } else if (action.type === "CreateDayAction") {
    const program = Program.getEditingProgram(state)!;
    const programIndex = Program.getEditingProgramIndex(state)!;
    const days = program.days;
    const dayName = `Day ${days.length + 1}`;
    const newProgram = lf(program)
      .p("days")
      .modify((d) => [...d, Program.createDay(dayName)]);
    let newState = lf(state).p("storage").p("programs").i(programIndex).set(newProgram);
    newState = lf(newState)
      .pi("editProgram")
      .p("dayIndex")
      .set(newProgram.days.length - 1);
    return lf(newState).p("screenStack").set(Screen.push(state.screenStack, "editProgramDay"));
  } else if (action.type === "EditDayAction") {
    return {
      ...state,
      editProgram: {
        ...state.editProgram!,
        dayIndex: action.index,
      },
      screenStack: Screen.push(state.screenStack, "editProgramDay"),
    };
  } else if (action.type === "EditDayAddSet") {
    return lf(state)
      .p("storage")
      .p("programs")
      .i(Program.getEditingProgramIndex(state))
      .p("days")
      .i(state.editProgram!.dayIndex!)
      .p("excercises")
      .i(action.excerciseIndex)
      .p("sets")
      .modify((sets) => {
        if (action.setIndex != null) {
          return lf(sets).i(action.setIndex).set(action.set);
        } else {
          return [...sets, action.set];
        }
      });
  } else if (action.type === "EditDayRemoveSet") {
    return lf(state)
      .p("storage")
      .p("programs")
      .i(Program.getEditingProgramIndex(state))
      .p("days")
      .i(state.editProgram!.dayIndex!)
      .p("excercises")
      .i(action.excerciseIndex)
      .p("sets")
      .modify((sets) => sets.filter((set, i) => i !== action.setIndex));
  } else {
    return state;
  }
};
