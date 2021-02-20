import { Test, VerboseReporter } from "@jest/reporters";
import type {
  AggregatedResult,
  AssertionResult,
  TestResult,
} from "@jest/test-result";
import { Suite } from "@jest/test-result";
import { Config } from "@jest/types";
import { CustomSuite } from "./classes";
// import { specialChars } from "jest-util";
import chalk = require("chalk");

interface LogOptions {
  previousIndent: string;
  previousStatus: Status;
  siblingsStatus: Status;
  last: boolean;
}

interface BoxChars {
  /**
   * Starting char
   */
  start: string;

  /**
   * Top and Right
   */
  tr: string;

  /**
   * Tor, Right and Bottom
   */
  trb: string;

  /**
   * Top and Bottom
   */
  tb: string;

  /**
   * Top, Bottom and Left.
   */
  tbl: string;

  /**
   * Top and Left
   */
  tl: string;

  /**
   * Right and Bottom
   */
  rb: string;

  /**
   * Right, Bottom and Left
   */
  rbl: string;

  /**
   * Right and Left
   */
  rl: string;

  /**
   * Bottom and Right
   */
  bl: string;
}

enum Status {
  FAILED = "failed",
  PENDING = "pending",
  TODO = "todo",
  PASSED = "passed",
}

type StatusDecorator = { [status in Status]: string };

// const { ICONS } = specialChars;

const boxChars: BoxChars = {
  start: "┃",
  trb: "┣",
  tr: "┗",
  tb: "┃",
  tbl: "┫",
  tl: "┛",
  rb: "┏",
  rbl: "┳",
  rl: "━",
  bl: "┓",
};

const testDecorators: StatusDecorator = {
  [Status.FAILED]: chalk.red("■"),
  [Status.PENDING]: chalk.yellow("■"),
  [Status.TODO]: chalk.magenta("■"),
  [Status.PASSED]: "■",
  // [Status.PASSED]: chalk.green(ICONS.success),
};

export class CoolReporter extends VerboseReporter {
  constructor(globalConfig: Config.GlobalConfig) {
    super(globalConfig);
  }

  onTestResult(
    test: Test,
    result: TestResult,
    aggregatedResults: AggregatedResult
  ): void {
    super.testFinished(test.context.config, result, aggregatedResults);
    if (!result.skipped) {
      this.printTestFileHeader(
        result.testFilePath,
        test.context.config,
        result
      );
      if (!result.testExecError && !result.skipped) {
        this.logTestResults(result.testResults);
      }
      this.printTestFileFailureMessage(
        result.testFilePath,
        test.context.config,
        result
      );
    }
    super.forceFlushBufferedOutput();
  }

  private logTestResults(testResults: Array<AssertionResult>) {
    const baseSuite = VerboseReporter.groupTestsBySuites(testResults);
    
    const custom = new CustomSuite(baseSuite, true, true);
    custom.setPreviousIndent("", false);
    
    // this.log(boxChars.start);
    // this.logSuite(
    //   VerboseReporter.groupTestsBySuites(testResults),
    //   {
    //     previousIndent: "",
    //     last: true,
    //     previousStatus: Status.PASSED,
    //     siblingsStatus: Status.PASSED,
    //   },
    //   false
    // );
    // this.log("");

    custom.log(this.log);
  }

  private indentInheritance(options: LogOptions) {
    const char = options.last ? boxChars.tr : boxChars.trb;

    return `${char}`;
  }

  private indentFollow(): string {
    return `${boxChars.rl}${boxChars.rl}`;
  }

  private logSuite(suite: Suite, options: LogOptions, log = true): void {
    const previousIndent = options.previousIndent;

    const suiteStatus = this.suiteStatus(suite);
    const suiteColorFn = this.statusColorFn(suiteStatus);
    const previousColorFn = this.statusColorFn(options.previousStatus);

    let nextIndent = "";
    if (log) {
      nextIndent = options.last ? "   " : `${boxChars.tb}  `;
      const indentInheritChar = previousColorFn(
        this.indentInheritance(options)
      );
      const indentFollow = suiteColorFn(this.indentFollow());
      const currentIndent = `${previousIndent}${indentInheritChar}${indentFollow}`;
      const currentDecorator = `${suiteColorFn(boxChars.rbl)}${boxChars.rl}${
        boxChars.tbl
      }`;
      const title = ` ${chalk.bold(suite.title)}`;

      this.logLine(
        `${previousIndent}${boxChars.tb}    ${boxChars.rb}${
          boxChars.rl
        }${boxChars.rl.repeat(suite.title.length)}${boxChars.rl}${boxChars.bl}`
      );
      this.logLine(
        `${currentIndent}${currentDecorator}${title} ${boxChars.tb}`
      );
      this.logLine(
        `${previousIndent}${nextIndent}${boxChars.tb} ${boxChars.tr}${
          boxChars.rl
        }${boxChars.rl.repeat(suite.title.length)}${boxChars.rl}${boxChars.tl}`
      );
    }

    const indent = `${previousIndent}${nextIndent}`;

    const tests = suite.tests;
    const suites = suite.suites;

    const testSiblingsStatus = Status.PASSED;
    const suitesSiblingsStatus = Status.PASSED;

    tests.forEach((test, idx) => {
      const isLast = idx === tests.length - 1 && suites.length === 0;
      this.logTest(test, {
        previousIndent: indent,
        last: isLast,
        previousStatus: suiteStatus,
        siblingsStatus: testSiblingsStatus,
      });
    });

    suites.forEach((suite, idx) => {
      const isLast = idx === suites.length - 1;
      this.logSuite(suite, {
        previousIndent: indent,
        last: isLast,
        previousStatus: suiteStatus,
        siblingsStatus: suitesSiblingsStatus,
      });
    });
  }

  private statusColorFn(status: Status): (str: string) => string {
    return status === Status.FAILED ? chalk.red : (str: string) => str;
  }

  private suiteStatus(suite: Suite): Status {
    const tests = suite.tests || [];
    const suites = suite.suites || [];
    const failedTests = tests.filter(({ status }) => status === Status.FAILED);
    const failedSuites = suites
      .map((suite) => this.suiteStatus(suite))
      .filter((status) => status === Status.FAILED);

    if (failedTests.length > 0 || failedSuites.length > 0) {
      return Status.FAILED;
    }

    return Status.PASSED;
  }

  private getIcon(status: string) {
    return testDecorators[status as Status] || testDecorators[Status.PASSED];
  }

  private logTest(test: AssertionResult, options: LogOptions): void {
    const indentInheritChar = this.indentInheritance(options);
    const icon = this.getIcon(test.status as Status);
    const indent = `${indentInheritChar}${this.indentFollow()}`;
    const statusToDim: string[] = [Status.PASSED, Status.TODO];
    const dimTitle = statusToDim.includes(test.status);
    const defaultFn = (str: string) => str;
    const titleFn: (str: string) => string = dimTitle ? chalk.dim : defaultFn;
    const title = ` ${titleFn(test.title)}`;

    const indentColorFn = this.statusColorFn(test.status as Status);

    const indentFollow = indentColorFn(`${indent}${boxChars.rl}`);
    const coloredIndent = `${options.previousIndent}${indentFollow}`;

    this.logLine(`${coloredIndent}${icon}${title}`);
  }

  private logLine(text: string): void {
    super.log(text);
  }
}

module.exports = CoolReporter;
