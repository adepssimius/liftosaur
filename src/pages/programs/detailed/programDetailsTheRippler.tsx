import { h, JSX } from "preact";
import { IProgram, IProgramState, ISettings } from "../../../types";
import { IAudioInterface } from "../../../lib/audioInterface";
import { ObjectUtils } from "../../../utils/object";
import { ProgramDetailsWorkoutPlayground } from "../programDetails/programDetailsWorkoutPlayground";
import { IconEditSquare } from "../../../components/icons/iconEditSquare";
import { IconCheckCircle } from "../../../components/icons/iconCheckCircle";
import { ProgramDetailsUpsell } from "../programDetails/programDetailsUpsell";
import { Program } from "../../../models/program";
import { ProgramExercise } from "../../../models/programExercise";
import { ProgramDetailsExerciseExample } from "../programDetails/programDetailsExerciseExample";
import { IPlaygroundDetailsWeekSetup } from "../programDetails/programDetailsWeekSetup";
import { Muscle } from "../../../models/muscle";
import { MusclesView } from "../../../components/muscles/musclesView";
import { ProgramDetailsGzclPrinciple } from "./programDetailsGzclPrinciple";

export interface IProgramDetailsTheRipplerProps {
  settings: ISettings;
  program: IProgram;
  client: Window["fetch"];
  audio: IAudioInterface;
}

export function ProgramDetailsTheRippler(props: IProgramDetailsTheRipplerProps): JSX.Element {
  const program = ObjectUtils.clone(props.program);
  const weekSetup = buildWeekSetup(props.settings, program);
  const programForMuscles = ObjectUtils.clone(program);
  const t3Exercises = programForMuscles.exercises.filter((e) => /(T3a|T3b)/.test(e.description || ""));
  for (const exercise of t3Exercises) {
    for (const variation of exercise.variations) {
      for (const sets of variation.sets) {
        sets.repsExpr = "10";
      }
    }
  }
  const points = Muscle.normalizePoints(Muscle.getPointsForProgram(programForMuscles, props.settings));
  const t1Pct = [85, 90, 87.5, 92.5, 90, 95, 92.5, 97.5, 95, 100, 90];
  const t2Pct = [80, 85, 90, 82.5, 87.5, 92.5, 85, 90, 95, 100];

  return (
    <section className="px-4">
      <h1 className="text-2xl font-bold leading-8 text-center">GZCL: The Rippler program explained</h1>
      <div className="mb-4 text-sm font-bold text-center">
        <a href="https://www.gainzfever.com/" target="_blank" className="underline text-bluev2">
          By Cody Lefever
        </a>
      </div>
      <div className="flex flex-col sm:flex-row program-details-description" style={{ gap: "1rem" }}>
        <div className="flex-1 min-w-0">
          <p>
            The Rippler is a weightlifting program based on the <strong>GZCL principle</strong>, created by{" "}
            <a href="https://www.gainzfever.com/" target="_blank">
              Cody Lefever
            </a>
            . The GZCL name comes from his Reddit username -{" "}
            <a href="https://www.reddit.com/u/gzcl" target="_blank">
              u/gzcl
            </a>
            . This program is an excellent next step following the beginner{" "}
            <a href="/programs/gzclp" target="_blank">
              GZCLP
            </a>{" "}
            program, particularly when your newbie gains have plateaued and you can't increase your weights as quickly.
          </p>
          <ProgramDetailsGzclPrinciple />
          <h2>Application of the GZCL Principle to The Rippler Program</h2>
          <p>
            In The Rippler program, we use the 2 rep max (2RM) weight as a basis. This is a <strong>12-week</strong>{" "}
            program, where the weight for T1 and T2 exercises changes each week according to a specific pattern.
          </p>
          <p>
            For <strong>T1 exercises</strong>, we increase the weight for 2 weeks, then slightly decrease it, and
            increase it even more in week 4. This pattern repeats through 4-week blocks. We'll have three 4-week blocks.
            We use 2 rep max (2RM) as a base weight for T1 exercises. So, for first 4 weeks we do 85%, 87.5%, 90%, 92.5%
            of 2RM weight.
          </p>
          <h3>Example of a T1 exercise sets/reps/weight week over week</h3>
          <div className="mb-4">
            <ProgramDetailsExerciseExample
              program={props.program}
              programExercise={props.program.exercises.find((pe) => pe.exerciseType.id === "benchPress")!}
              settings={props.settings}
              weekSetup={weekSetup.slice(0, 11).map((w, i) => ({ ...w, name: `${w.name} (${t1Pct[i]}%)` }))}
              weightInputs={[{ key: "rm2", label: "Enter your 2RM weight" }]}
            />
          </div>
          <p>
            For <strong>T2 exercises</strong>, we gradually increase the weights over 3 weeks (e.g., 80%, 85%, 90%),
            then reset to 82.5%, and increase again (82.5%, 87.5%, 92.5%). We repeat this pattern over four 3-week
            blocks, creating a wave-like pattern. We use 5 rep max (5RM) as a base weight for T2 exercises. We skip T2
            exercises completely on weeks 11 and 12.
          </p>
          <h3>Example of a T2 exercise sets/reps/weight week over week</h3>
          <div className="mb-4">
            <ProgramDetailsExerciseExample
              program={props.program}
              programExercise={props.program.exercises.find((pe) => pe.exerciseType.id === "inclineBenchPress")!}
              settings={props.settings}
              weekSetup={weekSetup.slice(0, 10).map((w, i) => ({ ...w, name: `${w.name} (${t2Pct[i]}%)` }))}
              weightInputs={[{ key: "rm5", label: "Enter your 5RM weight" }]}
            />
          </div>
          <p>
            For <strong>T3 exercises</strong>, we don't vary the weight, but aim to do the maximum reps each time. Start
            with a weight you can lift for 10 reps, then do as many reps as you can, leaving 1-2 reps in reserve. It's
            better to err on the side of lighter weights. If the weight you choose is too light, the Liftosaur app will
            automatically adjust and increase the weight as needed in weeks 3, 6, and 9.
          </p>
          <p>
            Feel free to substitute exercises if you don't have the necessary equipment or if you wish to target
            specific muscles, particularly for the T3 exercises. If you use the Liftosaur app, there's a handy
            "Substitute" exercise feature where you can select similar exercises that require different equipment.
          </p>
          <h2>1RM test</h2>
          <p>
            Starting from week 11, you'll begin preparing for the 1RM test. You won't do T2 and T3 exercises at all
            during this period. On week 11, you will do heavy 2RMs of T1, and on week 12, you'll test your 1RM, and
            enjoy your new PRs!
          </p>
          <p>
            Again, this is just a short description, and for full information and details, please read the{" "}
            <a href="http://swoleateveryheight.blogspot.com/2016/02/gzcl-applications-adaptations.html" target="_blank">
              original post with the GZCL applications
            </a>
            .
          </p>
          <p>
            Check the interactive playground below to see how the program works, and what the weights/sets/reps look
            like for each week. You can edit the 2RM, 5RM, etc weights for each exercise, and see how the weight
            changes.
          </p>
          <p>
            You can run GZCL: The Rippler program in the Liftosaur app. You only would need to set initial RM weights
            for each exercise, and the app will automatically calculate the weights, change the sets, autobalance the T3
            weights, and do all the math for you.
          </p>
        </div>
        <div className="w-64 mx-auto">
          <h3 className="text-lg font-bold leading-8 text-center">Muscle Balance</h3>
          <MusclesView title="Muscle Balance" settings={props.settings} points={points} hideListOfExercises={true} />
        </div>
      </div>
      <div className="w-32 h-px mx-auto my-8 b bg-grayv2-200" />
      <h3 className="mb-4 text-xl font-bold leading-8">Try it out in interactive playground!</h3>
      <p className="mb-4">
        Tap on squares to finish sets. Tap multiple times to reduce completed reps. Finish workout and see what the next
        time the workout would look like (with possibly updated weights, reps and sets).
      </p>
      <p className="mb-4">
        For convenience, you can finish all the sets of an exercise by clicking on the{" "}
        <IconCheckCircle className="inline-block" isChecked={true} color="#BAC4CD" /> icon. And you can adjust the
        exercise variables (weight, reps, TM, RIR, etc) by clicking on the <IconEditSquare className="inline-block" />{" "}
        icon.
      </p>
      <ProgramDetailsWorkoutPlayground
        program={props.program}
        settings={props.settings}
        client={props.client}
        weekSetup={weekSetup}
      />
      <div className="mt-8">
        <ProgramDetailsUpsell />
      </div>
    </section>
  );
}

function buildWeekSetup(settings: ISettings, program: IProgram): IPlaygroundDetailsWeekSetup[] {
  const weekSetup: IPlaygroundDetailsWeekSetup[] = [];
  for (let week = 1; week <= 12; week++) {
    const days = [];
    for (let day = 1; day <= 4; day++) {
      days.push({ dayIndex: day, states: buildStaticStates(settings, program, day, week) });
    }
    weekSetup.push({ name: `Week ${week}`, days });
  }
  return weekSetup;
}

function buildStaticStates(
  settings: ISettings,
  program: IProgram,
  dayIndex: number,
  week: number
): Partial<Record<string, IProgramState>> {
  const day = program.days[dayIndex - 1];

  return program.exercises.reduce<Partial<Record<string, IProgramState>>>((acc, exercise) => {
    if (day.exercises.map((e) => e.id).indexOf(exercise.id) !== -1) {
      const staticState: IProgramState = { week: week - 1 };
      const script = ProgramExercise.getFinishDayScript(exercise, program.exercises);
      const state = ProgramExercise.getState(exercise, program.exercises);
      const entry = Program.programExerciseToHistoryEntry(exercise, program.exercises, dayIndex, settings, { week });
      const newStaticState = Program.runExerciseFinishDayScript(
        entry,
        dayIndex,
        settings,
        state,
        script,
        entry.exercise.equipment,
        staticState
      );
      if (newStaticState.success) {
        for (const key of ["reps", "intensity"]) {
          if (state[key] != null) {
            staticState[key] = newStaticState.data[key];
          }
        }
        staticState.week = week;
      }

      acc[exercise.id] = staticState;
    }
    return acc;
  }, {});
}
