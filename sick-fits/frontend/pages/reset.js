import ResetPassword from "../components/Reset";
const ResetPage = props => (
  <div>
    <ResetPassword resetToken={props.query.resetToken} />
  </div>
);

export default ResetPage;
