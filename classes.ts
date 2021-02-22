import type { AssertionResult } from "@jest/test-result";
import { Suite } from "@jest/test-result";
import { formatTime } from "jest-util";
import { Status } from "./types";
import { boxChars, failedStatus, ICONS, same } from "./utils";
import chalk = require("chalk");

export class CustomSuite {
  public title = "";
  public skip = false;
  public tests: CustomTest[] = [];
  public suites: CustomSuite[] = [];
  public status: Status = Status.PASSED;
  public isLast = false;
  public nextSiblingsFails = false;
  private previousIndent = "";

  constructor(suite: Suite, isLast: boolean, skip = false) {
    this.skip = skip || false;
    this.isLast = isLast;
    this.title = suite.title;

    const hasSuites = suite.suites.length > 0;

    this.tests = suite.tests.map((test, idx) => {
      const isLast = !hasSuites && idx === suite.tests.length - 1;
      return new CustomTest(test, isLast);
    });

    this.suites = [];
    for (let idx = 0; idx < suite.suites.length; idx++) {
      const child = suite.suites[idx];
      const isLast = idx === suite.suites.length - 1;
      const item = new CustomSuite(child, isLast);
      this.suites.push(item);

      if (item.someChildFailed) {
        for (let previousIdx = 0; previousIdx < idx; previousIdx++) {
          this.suites[previousIdx].nextSiblingsFails = true;
        }
      }
    }

    this.status = this.someChildFailed ? Status.FAILED : Status.PASSED;

    let someSiblingFailed = this.someSuiteFailed;
    for (let i = this.tests.length - 1; i >= 0; i--) {
      const test = this.tests[i];
      test.nextSiblingsFails = someSiblingFailed;
      someSiblingFailed = someSiblingFailed || failedStatus(test.status);
    }
  }

  public setPreviousIndent(previousIndent: string, decorate: boolean): void {
    this.previousIndent = previousIndent;

    let nextIndent = "";
    if (!this.skip) {
      const decorateFn = decorate ? chalk.red : same;
      nextIndent = this.isLast ? "   " : `${decorateFn(boxChars.tb)}  `;
    }

    const indent = `${previousIndent}${nextIndent}`;

    for (let idx = 0; idx < this.tests.length; idx++) {
      const test = this.tests[idx];
      test.previousIndent = indent;
    }
    for (let idx = 0; idx < this.suites.length; idx++) {
      const child = this.suites[idx];
      const actualIdx = this.tests.length + idx;
      child.setPreviousIndent(indent, actualIdx < this.maxFailedIdx);
    }
  }

  public log(logFn: (str: string) => void): void {
    if (!this.skip) {
      const title = this.decorateFn(this.title);

      const branchChar = this.isLast ? boxChars.tr : boxChars.trb;
      const branch = this.decorateFn(branchChar);

      const leftRow = `${boxChars.rl}${boxChars.rl}`;
      const rowBranch = boxChars.rbl;
      const rightRow = boxChars.rl;

      const rowChars = `${leftRow}${rowBranch}${rightRow}${boxChars.tbl}`;
      const row = this.decorateFn(rowChars);

      const upperBoxSpace = `${branchChar}${rowChars}`.length - 2;
      const upperBox = `${boxChars.tb}${" ".repeat(upperBoxSpace)}${
        this.topBox
      }`;

      const bottomBoxBranchChar = this.isLast ? " " : boxChars.tb;
      const bottomBoxLeftSpace = `${branchChar}${leftRow}`.length - 1;
      const bottomBoxLeft = " ".repeat(bottomBoxLeftSpace);
      const bottomBoxRightSpace = rightRow.length;
      const bottomBoxRight = " ".repeat(bottomBoxRightSpace);

      const decorateBottomBoxBranch = this.nextSiblingsFails;
      const decoretaBottomBoxFn = decorateBottomBoxBranch ? chalk.red : same;

      const bottomBoxIndent = `${bottomBoxLeft}${boxChars.tb}${bottomBoxRight}`;
      const bottomBox = `${bottomBoxIndent}${this.bottomBox}`;

      const topLineStr = this.decorateFn(upperBox);
      const titleStr = this.decorateFn(
        `${branch}${row} ${title} ${boxChars.tb}`
      );
      const bottomLineStr = `${decoretaBottomBoxFn(
        bottomBoxBranchChar
      )}${this.decorateFn(bottomBox)}`;

      logFn(`${this.previousIndent}${topLineStr}`);
      logFn(`${this.previousIndent}${titleStr}`);
      logFn(`${this.previousIndent}${bottomLineStr}`);
    } else {
      logFn(this.decorateFn(boxChars.start));
    }

    for (const test of this.tests) {
      test.log(logFn);
    }

    for (const child of this.suites) {
      child.log(logFn);
    }
  }

  public get decorateFn(): (str: string) => string {
    const decorateItem = this.someChildFailed;
    return decorateItem ? chalk.red : same;
  }

  public get maxFailedIdx(): number {
    let maxIdx = -1;
    [...this.tests, ...this.suites].forEach((item, idx) => {
      if (failedStatus(item.status)) {
        maxIdx = Math.max(idx, idx);
      }
    });

    return maxIdx;
  }

  public get someChildFailed(): boolean {
    return this.maxFailedIdx > -1;
  }

  public get someSuiteFailed(): boolean {
    return this.suites.filter(({ status }) => failedStatus(status)).length > 0;
  }

  public get someTestFailed(): boolean {
    return this.tests.filter(({ status }) => failedStatus(status)).length > 0;
  }

  private get topBox(): string {
    return `${boxChars.rb}${this.horizontalBox}${boxChars.bl}`;
  }

  private get bottomBox(): string {
    return `${boxChars.tr}${this.horizontalBox}${boxChars.tl}`;
  }

  private get horizontalBox(): string {
    return boxChars.rl.repeat(this.title.length + 2);
  }
}

export class CustomTest {
  public base: AssertionResult;
  public status: Status = Status.PASSED;
  public isLast = false;
  public previousIndent = "";

  public nextSiblingsFails = false;

  constructor(test: AssertionResult, isLast: boolean) {
    this.base = test;
    this.isLast = isLast;
    this.status = test.status as Status;
  }

  public get statusIcon(): string {
    if (this.status === Status.FAILED) {
      return chalk.red(ICONS.failed);
    } else if (this.status === Status.PENDING) {
      return chalk.yellow(ICONS.pending);
    } else if (this.status === Status.TODO) {
      return chalk.magenta(ICONS.todo);
    } else {
      return chalk.green(ICONS.success);
    }
  }

  public get time(): string {
    if (this.base.duration) {
      return `(${formatTime(Math.round(this.base.duration))})`;
    }

    return "";
  }

  public log(logFn: (str: string) => void): void {
    const titleDecoratorFn = this.failed ? same : chalk.dim;
    const title = titleDecoratorFn(`${this.base.title} ${this.time}`);

    const decorateBranch = this.failed || this.nextSiblingsFails;
    const branchDecoratorFn = decorateBranch ? chalk.red : same;
    const branchChar = this.isLast ? boxChars.tr : boxChars.trb;
    const branch = branchDecoratorFn(branchChar);

    const decorateRow = this.failed;
    const rowDecoratorFn = decorateRow ? chalk.red : same;
    const row = rowDecoratorFn(boxChars.rl.repeat(4));

    logFn(`${this.previousIndent}${branch}${row} ${this.statusIcon} ${title}`);
  }

  public get failed(): boolean {
    return failedStatus(this.status);
  }
}
