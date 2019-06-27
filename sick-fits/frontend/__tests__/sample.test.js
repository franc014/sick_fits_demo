describe("sample test 101", () => {
  it("works as expected", () => {
    expect(100).toEqual(100);
  });
  it("makes a list of dog names", () => {
    const dogs = ["lisa", "vianca", "becan"];

    expect(dogs).toEqual(dogs);
    expect(dogs).toContain("vianca");
  });
});
