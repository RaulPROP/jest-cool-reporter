it("A", () => expect(true).toBe(true));

describe("1", () => {
  describe("1-1", () => {
    describe("1-1-1", () => {
      it("1-1-1 A", () => expect(false).toBe(true));
      it("1-1-1 B", () => expect(true).toBe(true));
    });
    it("1-1 A", () => expect(true).toBe(true));
  });

  describe("1-2", () => {
    it("1-2 A", () => expect(true).toBe(true));
  });
});

describe('2', () => {
    describe("2-1", () => {
        describe("2-1-1", () => {
          xit("2-1-1 A", () => expect(true).toBe(true));
          it("2-1-1 B", () => expect(true).toBe(true));
        });
        it("2-1 A", () => expect(false).toBe(true));
      });
    
      describe("2-2", () => {
        it("2-2 A", () => expect(true).toBe(true));
      });
})
