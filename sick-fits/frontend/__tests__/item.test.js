import ItemComponent from "../components/Item";
import { shallow } from "enzyme";
import toJSON from "enzyme-to-json";

const fakeItem = {
  id: "ABC123",
  title: "A cool item",
  price: 5000,
  description: "this item is really cool",
  image: "dog.jpg",
  largeImage: "largeDog.jpg"
};

describe("<Item />", () => {
  //snapshots

  it("renders and matches the snapshot", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });

  it("renders the item image properly", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const img = wrapper.find("img");
    expect(img.props().src).toBe(fakeItem.image);
    expect(img.props().alt).toBe(fakeItem.title);
  });

  it("renders and displays properly", () => {
    //mount the component: wrapper, because it's the entire component
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const priceTag = wrapper.find("PriceTag");
    /*  console.log(priceTag.dive().text());
    console.log(priceTag.children().text()); */
    expect(priceTag.children().text()).toBe("$50");
    expect(wrapper.find("Title a").text()).toBe(fakeItem.title);
  });

  it("renders out the buttons properly", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    const ButtonList = wrapper.find(".buttonList");
    expect(ButtonList.children()).toHaveLength(3);
    expect(ButtonList.find("Link").exists()).toBe(true);
    expect(ButtonList.find("AddToCart").exists()).toBe(true);
    expect(ButtonList.find("DeleteItem").exists()).toBe(true);
  });
});
