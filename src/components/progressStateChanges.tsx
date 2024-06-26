import { h, JSX, Fragment } from "preact";
import { IProgramMode, Program } from "../models/program";
import { ObjectUtils } from "../utils/object";
import { Weight } from "../models/weight";
import { StringUtils } from "../utils/string";
import { Reps } from "../models/set";
import { IHistoryEntry, ISettings, IProgramState, IDayData, IProgramExercise, IProgram } from "../types";
import { Exercise } from "../models/exercise";
import { ProgramExercise } from "../models/programExercise";

interface IProps {
  entry: IHistoryEntry;
  settings: ISettings;
  dayData: IDayData;
  programExercise: IProgramExercise;
  program: IProgram;
  userPromptedStateVars?: IProgramState;
  forceShow?: boolean;
  staticState?: IProgramState;
  mode: IProgramMode;
}

export function ProgressStateChanges(props: IProps): JSX.Element | null {
  const state = ProgramExercise.getState(props.programExercise, props.program.exercises);
  const { entry, settings, dayData } = props;
  const { units } = settings;
  const mergedState = { ...state, ...props.userPromptedStateVars };
  const result = Program.runExerciseFinishDayScript(
    entry,
    dayData,
    settings,
    mergedState,
    props.programExercise,
    props.program,
    props.mode,
    props.staticState
  );
  const isFinished = Reps.isFinished(entry.sets);

  if ((props.forceShow || isFinished) && result.success) {
    const { state: newState, updates, bindings } = result.data;
    const diffState = ObjectUtils.keys(state).reduce<Record<string, string | undefined>>((memo, key) => {
      const oldValue = state[key];
      const newValue = newState[key];
      if (!Weight.eq(oldValue, newValue)) {
        const oldValueStr = Weight.display(Weight.convertTo(oldValue as number, units));
        const newValueStr = Weight.display(Weight.convertTo(newValue as number, units));
        memo[key] = `${oldValueStr} -> ${newValueStr}`;
      }
      return memo;
    }, {});
    const diffVars: Record<string, string | undefined> = {};
    if (bindings.rm1 != null) {
      const oldOnerm = Exercise.onerm(entry.exercise, settings);
      if (!Weight.eq(oldOnerm, bindings.rm1)) {
        diffVars["1 RM"] = `${Weight.display(Weight.convertTo(oldOnerm, units))} -> ${Weight.display(
          Weight.convertTo(bindings.rm1, units)
        )}`;
      }
    }
    for (const update of updates) {
      const key = update.type;
      const value = update.value;
      const target = value.target;
      while (target[0] === "*") {
        target.shift();
      }
      const keyStr = `${key}${target.length > 0 ? `[${target.join(":")}]` : ""}`;
      diffVars[keyStr] = `${value.op !== "=" ? `${value.op} ` : ""}${Weight.printOrNumber(value.value)}`;
    }

    if (ObjectUtils.isNotEmpty(diffState) || ObjectUtils.isNotEmpty(diffVars)) {
      return (
        <div
          className="text-xs"
          data-help-id="progress-state-changes"
          data-help="This shows how state variables of the exercise are going to change after finishing this workout day. It usually indicates progression or deload, so next time you'd do more/less reps, or lift more/less weight."
        >
          {ObjectUtils.isNotEmpty(diffVars) && (
            <>
              <header className="font-bold">Exercise Changes</header>
              <ul data-cy="variable-changes">
                {ObjectUtils.keys(diffVars).map((key) => (
                  <li data-cy={`variable-changes-key-${StringUtils.dashcase(key)}`}>
                    <span className="italic">{key}</span>:{" "}
                    <strong data-cy={`variable-changes-value-${StringUtils.dashcase(key)}`}>{diffVars[key]}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
          {ObjectUtils.isNotEmpty(diffState) && (
            <>
              <header className="font-bold">State Variables changes</header>
              <ul data-cy="state-changes">
                {ObjectUtils.keys(diffState).map((key) => (
                  <li data-cy={`state-changes-key-${StringUtils.dashcase(key)}`}>
                    <span className="italic">{key}</span>:{" "}
                    <strong data-cy={`state-changes-value-${StringUtils.dashcase(key)}`}>{diffState[key]}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    }
  }
  return null;
}
