import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import wait from "waait";
import RequestReset, {
  REQUEST_RESET_MUTATION
} from "../components/RequestReset";
import { MockedProvider } from "react-apollo/test-utils";

const mocks = [
  {
    request: {
      query: REQUEST_RESET_MUTATION,
      variables: { email: "jfandradea@gmail.com" }
    },
    result: {
      data: {
        requestReset: {
          message: "success",
          __typename: "Message"
        }
      }
    }
  }
];

describe("<RequestReset />", () => {
  it("renders and matches snapshot", async () => {
    const wrapper = mount(
      <MockedProvider>
        <RequestReset />
      </MockedProvider>
    );
    const form = wrapper.find('form[data-test="form"]');
    expect(toJSON(form)).toMatchSnapshot();
  });
  it("calls the mutation", async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <RequestReset />
      </MockedProvider>
    );

    //simulate typing email
    wrapper.find("input").simulate("change", {
      target: { name: "email", value: "jfandradea@gmail.com" }
    });
    //submit
    wrapper.find("form").simulate("submit");
    await wait();
    wrapper.update();
    expect(wrapper.find("p").text()).toContain(
      "Success! check your email for the reset link"
    );
  });
});
