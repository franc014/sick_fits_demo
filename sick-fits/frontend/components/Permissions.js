import React, { Component } from "react";

import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import Error from "./ErrorMessage";
import Table from "./styles/Table";
import Button from "./styles/SickButton";
import PropTypes from "prop-types";

const possiblePermissions = [
  "ADMIN",
  "USER",
  "ITEMCREATE",
  "ITEMUPDATE",
  "ITEMDELETE",
  "PERMISSIONUPDATE"
];

const ALL_USERS_QUERY = gql`
  query {
    users {
      id
      name
      email
      permissions
    }
  }
`;

const UPDATE_PERMISSIONS = gql`
  mutation updatePermissions($permissions: [Permission], $userId: ID!) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      name
      email
      permissions
    }
  }
`;

class Permissions extends Component {
  render() {
    return (
      <Query query={ALL_USERS_QUERY}>
        {({ data, error, loading }) => {
          return (
            <div>
              <Error error={error} />
              <div>
                <h2>Manage Permissions</h2>
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      {possiblePermissions.map(permission => {
                        return <th key={permission}>{permission}</th>;
                      })}
                      <th>Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map(user => (
                      <UserPermissions user={user} key={user.id} />
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          );
        }}
      </Query>
    );
  }
}

class UserPermissions extends Component {
  static propTypes = {
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permissions: PropTypes.array
    }).isRequired
  };
  state = {
    permissions: this.props.user.permissions
  };
  handlePermissionChange = e => {
    const checkbox = e.target;
    //take a copy of current permissions
    let updatedPermissions = [...this.state.permissions];

    //figure out if we need to add or remove permisson
    if (checkbox.checked) {
      //add it in
      updatedPermissions.push(checkbox.value);
    } else {
      updatedPermissions = updatedPermissions.filter(
        permission => permission !== checkbox.value
      );
    }
    console.log(updatedPermissions);
    this.setState({ permissions: updatedPermissions });
  };
  render() {
    const user = this.props.user;
    return (
      <Mutation
        mutation={UPDATE_PERMISSIONS}
        variables={{
          permissions: this.state.permissions,
          userId: this.props.user.id
        }}
      >
        {(updatePermissions, { loading, error }) => {
          return (
            <>
              {error && (
                <tr>
                  <td colspan="8">
                    <Error error={error} />
                  </td>
                </tr>
              )}
              <tr>
                <td>{user.name}</td>
                <td>{user.email}</td>
                {possiblePermissions.map(permission => {
                  return (
                    <td key={permission}>
                      <label htmlFor={`${user.id}-permission-${permission}`}>
                        <input
                          id={`${user.id}-permission-${permission}`}
                          type="checkbox"
                          checked={this.state.permissions.includes(permission)}
                          value={permission}
                          onChange={this.handlePermissionChange}
                        />
                      </label>
                    </td>
                  );
                })}
                <td>
                  <Button
                    disabled={loading}
                    type="button"
                    onClick={updatePermissions}
                  >
                    Updat{loading ? "ing" : "e"}
                  </Button>
                </td>
              </tr>
            </>
          );
        }}
      </Mutation>
    );
  }
}

export default Permissions;
