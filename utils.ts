import { specialChars } from "jest-util";
import { BoxChars, Status, StatusDecorator } from "./types";
import chalk = require("chalk");

export const { ICONS } = specialChars;

export const boxChars: BoxChars = {
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

export const testDecorators: StatusDecorator = {
  [Status.FAILED]: chalk.red("■"),
  [Status.PENDING]: chalk.yellow("■"),
  [Status.TODO]: chalk.magenta("■"),
  [Status.PASSED]: "■",
};

export function failedStatus(status: Status): boolean {
  return status === Status.FAILED;
}

export function same<T>(item: T): T {
  return item;
}

export function nextIndentChar(last: boolean): string {
  return last ? " " : boxChars.tb;
}
