export interface LogOptions {
  previousIndent: string;
  previousStatus: Status;
  siblingsStatus: Status;
  last: boolean;
}

export interface BoxChars {
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

export enum Status {
  FAILED = "failed",
  PENDING = "pending",
  TODO = "todo",
  PASSED = "passed",
}

export type StatusDecorator = { [status in Status]: string };
