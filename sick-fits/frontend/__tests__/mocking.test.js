function Person(name, foods) {
  this.name = name;
  this.foods = foods;
}

Person.prototype.fetchFavFoods = function() {
  return new Promise((resolve, reject) => {
    // simulating any api
    setTimeout(() => resolve(this.foods), 2000);
  });
};

describe("mocking learning", () => {
  it("mocks a reg function", () => {
    const fetchDogs = jest.fn();
    fetchDogs("becan");
    expect(fetchDogs).toHaveBeenCalled();
    expect(fetchDogs).toHaveBeenCalledWith("becan");
    fetchDogs("flopy");
    expect(fetchDogs).toHaveBeenCalledWith("flopy");
    expect(fetchDogs).toHaveBeenCalledTimes(2);
  });

  it("can create a person", () => {
    const me = new Person("Juan", ["pizza", "burgs"]);
    expect(me.name).toBe("Juan");
  });

  it("can fetch foods", async () => {
    const me = new Person("Juan", ["pizza", "burgs"]);
    //mock the fav foods function
    me.fetchFavFoods = jest.fn().mockResolvedValue(["sushi", "roman", "pizza"]);
    const favFoods = await me.fetchFavFoods();

    expect(favFoods).toContain("pizza");
  });
});
